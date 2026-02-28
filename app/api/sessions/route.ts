import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users, studySessions, userProgress, wattsTransactions } from "@/lib/db";
import { eq, sql, and, count } from "drizzle-orm";
import crypto from "crypto";
import { calculateSessionWatts, getStreakMilestoneReward } from "@/lib/watts";
import { calculateAmps, getDaysIdle } from "@/lib/amps";
import type { VoltageTier } from "@/types/reward-system";

// POST - Create a new study session
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionType, categorySlug } = body;

    if (!sessionType || !["quiz", "flashcard", "mock_exam", "daily_challenge", "load_calculator"].includes(sessionType)) {
      return NextResponse.json(
        { error: "Invalid session type" },
        { status: 400 }
      );
    }

    const sessionId = crypto.randomUUID();

    await db.insert(studySessions).values({
      id: sessionId,
      userId: session.user.id,
      sessionType,
      categorySlug: categorySlug || null,
      startedAt: new Date(),
      xpEarned: 0,
      wattsEarned: 0,
    });

    return NextResponse.json({
      success: true,
      sessionId,
    });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - End a study session and award completion bonus
export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, xpEarned, questionsAnswered, questionsCorrect, difficulty } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 }
      );
    }

    // Get current user state
    const [currentUser] = await db
      .select({
        wattsBalance: users.wattsBalance,
        wattsLifetime: users.wattsLifetime,
        level: users.level,
        studyStreak: users.studyStreak,
        bestStudyStreak: users.bestStudyStreak,
        lastStudyDate: users.lastStudyDate,
        streakFuseExpiresAt: users.streakFuseExpiresAt,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    const voltageTier = (currentUser?.level || 1) as VoltageTier;

    // Calculate current amps
    const daysIdle = getDaysIdle(currentUser?.lastStudyDate || null);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const [volumeResult] = await db
      .select({ count: count() })
      .from(userProgress)
      .where(
        sql`${userProgress.userId} = ${session.user.id} AND ${userProgress.answeredAt} >= ${sevenDaysAgo.getTime() / 1000}`
      );
    const questionsLast7Days = volumeResult?.count || 0;

    // Calculate study streak using UTC date strings
    const todayUTC = new Date().toISOString().slice(0, 10);
    const yesterdayDate = new Date();
    yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
    const yesterdayUTC = yesterdayDate.toISOString().slice(0, 10);

    // Check if streak fuse is active (protects against streak reset)
    const streakFuseActive = currentUser?.streakFuseExpiresAt && currentUser.streakFuseExpiresAt > new Date();

    let newStreak = 1;
    if (currentUser?.lastStudyDate) {
      const lastStudyUTC = new Date(currentUser.lastStudyDate).toISOString().slice(0, 10);
      if (lastStudyUTC === yesterdayUTC) {
        newStreak = (currentUser.studyStreak || 0) + 1;
      } else if (lastStudyUTC === todayUTC) {
        newStreak = currentUser.studyStreak || 1;
      } else if (streakFuseActive) {
        // Streak fuse protects: keep current streak + 1 instead of resetting
        newStreak = (currentUser.studyStreak || 0) + 1;
      }
    }

    const newBestStreak = Math.max(newStreak, currentUser?.bestStudyStreak || 0);

    // Calculate amps with new streak
    const ampsState = calculateAmps({
      streakDays: newStreak,
      questionsLast7Days,
      daysIdle: 0, // Just studied
    });

    // Calculate session completion Watts
    const sessionWatts = calculateSessionWatts(difficulty, voltageTier, ampsState.totalAmps);

    // Check for streak milestone bonus
    const streakBonus = getStreakMilestoneReward(newStreak) || 0;
    const totalWattsEarned = sessionWatts + streakBonus;

    const newBalance = (currentUser?.wattsBalance || 0) + totalWattsEarned;
    const newLifetime = (currentUser?.wattsLifetime || 0) + totalWattsEarned;

    // Update the session
    await db
      .update(studySessions)
      .set({
        endedAt: new Date(),
        xpEarned: xpEarned || 0,
        wattsEarned: totalWattsEarned,
        questionsAnswered: questionsAnswered ?? null,
        questionsCorrect: questionsCorrect ?? null,
      })
      .where(
        and(
          eq(studySessions.id, sessionId),
          eq(studySessions.userId, session.user.id)
        )
      );

    // Update user
    await db
      .update(users)
      .set({
        wattsBalance: newBalance,
        wattsLifetime: newLifetime,
        xp: newLifetime,
        level: voltageTier, // Voltage tier re-calculated elsewhere based on content mastery
        studyStreak: newStreak,
        bestStudyStreak: newBestStreak,
        lastStudyDate: new Date(),
        ampsBase: ampsState.totalAmps,
        ampsLastCalculated: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    // Log session completion watts transaction
    await db.insert(wattsTransactions).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      type: "session_complete",
      amount: sessionWatts,
      balanceAfter: newBalance - streakBonus,
      voltageAtTime: voltageTier,
      ampsAtTime: ampsState.totalAmps,
      description: `Session complete (${difficulty || "journeyman"})`,
    });

    // Log streak milestone bonus if applicable
    if (streakBonus > 0) {
      await db.insert(wattsTransactions).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        type: "streak_milestone",
        amount: streakBonus,
        balanceAfter: newBalance,
        voltageAtTime: voltageTier,
        ampsAtTime: ampsState.totalAmps,
        description: `${newStreak}-day streak milestone!`,
      });
    }

    console.log(`Session complete for user ${session.user.id}: +${totalWattsEarned}W, streak=${newStreak}`);

    return NextResponse.json({
      success: true,
      wattsEarned: totalWattsEarned,
      wattsBalance: newBalance,
      newStreak,
      currentAmps: ampsState.totalAmps,
      voltageTier,
    });
  } catch (error) {
    console.error("Error ending session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
