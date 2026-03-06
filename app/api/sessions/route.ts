import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users, studySessions, wattsTransactions } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { getStreakMilestoneReward } from "@/lib/watts";
import { getUserClassification, getClassificationTitle, checkClassificationAdvancement } from "@/lib/voltage";

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

// PATCH - End a study session and award watts (pre-calculated by client)
export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, wattsEarned = 0, activityType = "quiz_complete", questionsAnswered, questionsCorrect } = body;

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
        studyStreak: users.studyStreak,
        bestStudyStreak: users.bestStudyStreak,
        lastStudyDate: users.lastStudyDate,
        streakFuseExpiresAt: users.streakFuseExpiresAt,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    // Calculate study streak using UTC date strings
    const todayUTC = new Date().toISOString().slice(0, 10);
    const yesterdayDate = new Date();
    yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
    const yesterdayUTC = yesterdayDate.toISOString().slice(0, 10);

    const streakFuseActive = currentUser?.streakFuseExpiresAt && currentUser.streakFuseExpiresAt > new Date();

    let newStreak = 1;
    if (currentUser?.lastStudyDate) {
      const lastStudyUTC = new Date(currentUser.lastStudyDate).toISOString().slice(0, 10);
      if (lastStudyUTC === yesterdayUTC) {
        newStreak = (currentUser.studyStreak || 0) + 1;
      } else if (lastStudyUTC === todayUTC) {
        newStreak = currentUser.studyStreak || 1;
      } else if (streakFuseActive) {
        newStreak = (currentUser.studyStreak || 0) + 1;
      }
    }

    const newBestStreak = Math.max(newStreak, currentUser?.bestStudyStreak || 0);

    // Check for streak milestone bonus
    const streakBonus = getStreakMilestoneReward(newStreak) || 0;
    const totalWattsEarned = wattsEarned + streakBonus;

    const previousBalance = currentUser?.wattsBalance || 0;
    const newBalance = previousBalance + totalWattsEarned;
    const newLifetime = (currentUser?.wattsLifetime || 0) + totalWattsEarned;

    // Update the session
    await db
      .update(studySessions)
      .set({
        endedAt: new Date(),
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
        studyStreak: newStreak,
        bestStudyStreak: newBestStreak,
        lastStudyDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    // Log activity watts transaction
    await db.insert(wattsTransactions).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      type: activityType,
      amount: wattsEarned,
      balanceAfter: newBalance - streakBonus,
      voltageAtTime: 0,
      ampsAtTime: 0,
      description: `${activityType} (${questionsCorrect ?? 0}/${questionsAnswered ?? 0} correct)`,
    });

    // Log streak milestone bonus if applicable
    if (streakBonus > 0) {
      await db.insert(wattsTransactions).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        type: "streak_milestone",
        amount: streakBonus,
        balanceAfter: newBalance,
        voltageAtTime: 0,
        ampsAtTime: 0,
        description: `${newStreak}-day streak milestone!`,
      });
    }

    // Check for classification advancement
    const advancement = checkClassificationAdvancement(previousBalance, newBalance);

    const classification = getUserClassification(newBalance).classification;
    const classificationTitle = getClassificationTitle(newBalance);

    console.log(`Session complete for user ${session.user.id}: +${totalWattsEarned}W, streak=${newStreak}`);

    return NextResponse.json({
      success: true,
      wattsEarned: totalWattsEarned,
      wattsBalance: newBalance,
      newStreak,
      classification,
      classificationTitle,
      advancement,
    });
  } catch (error) {
    console.error("Error ending session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
