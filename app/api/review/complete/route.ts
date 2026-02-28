import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users, studySessions, wattsTransactions } from "@/lib/db";
import { eq, sql, count } from "drizzle-orm";
import crypto from "crypto";
import { calculateSessionWatts } from "@/lib/watts";
import { calculateAmps, getDaysIdle } from "@/lib/amps";
import { userProgress } from "@/lib/db/schema";
import type { VoltageTier } from "@/types/reward-system";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, questionsReviewed, questionsCorrect } = body;

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
        lastStudyDate: users.lastStudyDate,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    const voltageTier = (currentUser?.level || 1) as VoltageTier;

    // Calculate amps
    const daysIdle = getDaysIdle(currentUser?.lastStudyDate || null);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const [volumeResult] = await db
      .select({ count: count() })
      .from(userProgress)
      .where(
        sql`${userProgress.userId} = ${session.user.id} AND ${userProgress.answeredAt} >= ${Math.floor(sevenDaysAgo.getTime() / 1000)}`
      );

    const ampsState = calculateAmps({
      streakDays: currentUser?.studyStreak || 0,
      questionsLast7Days: volumeResult?.count || 0,
      daysIdle: 0, // Just studied
    });

    // Award session completion Watts (uses "journeyman" base since review is mixed difficulty)
    const sessionWatts = calculateSessionWatts("journeyman", voltageTier, ampsState.totalAmps);

    const newBalance = (currentUser?.wattsBalance || 0) + sessionWatts;
    const newLifetime = (currentUser?.wattsLifetime || 0) + sessionWatts;

    // Update the session record
    await db
      .update(studySessions)
      .set({
        endedAt: new Date(),
        wattsEarned: sessionWatts,
        questionsAnswered: questionsReviewed ?? null,
        questionsCorrect: questionsCorrect ?? null,
      })
      .where(eq(studySessions.id, sessionId));

    // Update user Watts
    await db
      .update(users)
      .set({
        wattsBalance: newBalance,
        wattsLifetime: newLifetime,
        xp: newLifetime,
        ampsBase: ampsState.totalAmps,
        ampsLastCalculated: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    // Log transaction
    await db.insert(wattsTransactions).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      type: "session_complete",
      amount: sessionWatts,
      balanceAfter: newBalance,
      voltageAtTime: voltageTier,
      ampsAtTime: ampsState.totalAmps,
      description: `Review session complete (${questionsReviewed || 0} questions)`,
    });

    return NextResponse.json({
      success: true,
      wattsEarned: sessionWatts,
      wattsBalance: newBalance,
      currentAmps: ampsState.totalAmps,
    });
  } catch (error) {
    console.error("Error completing review session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
