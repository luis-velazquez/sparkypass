import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users, userProgress } from "@/lib/db";
import { eq, sql, count } from "drizzle-orm";
import { calculateAmps, getDaysIdle } from "@/lib/amps";
import type { VoltageTier } from "@/types/reward-system";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select({
        name: users.name,
        username: users.username,
        wattsBalance: users.wattsBalance,
        wattsLifetime: users.wattsLifetime,
        level: users.level,
        studyStreak: users.studyStreak,
        lastStudyDate: users.lastStudyDate,
        targetExamDate: users.targetExamDate,
        hasSeenOnboarding: users.hasSeenOnboarding,
        hasSeenTour: users.hasSeenTour,
        necYear: users.necYear,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate current amps
    const daysIdle = getDaysIdle(user.lastStudyDate);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const [volumeResult] = await db
      .select({ count: count() })
      .from(userProgress)
      .where(
        sql`${userProgress.userId} = ${session.user.id} AND ${userProgress.answeredAt} >= ${sevenDaysAgo.getTime() / 1000}`
      );

    const ampsState = calculateAmps({
      streakDays: user.studyStreak,
      questionsLast7Days: volumeResult?.count || 0,
      daysIdle,
    });

    return NextResponse.json({
      name: user.name,
      username: user.username,
      wattsBalance: user.wattsBalance,
      wattsLifetime: user.wattsLifetime,
      voltageTier: user.level as VoltageTier,
      currentAmps: ampsState.totalAmps,
      studyStreak: user.studyStreak,
      targetExamDate: user.targetExamDate?.toISOString() || null,
      hasSeenOnboarding: user.hasSeenOnboarding ?? false,
      hasSeenTour: user.hasSeenTour ?? false,
      necYear: user.necYear,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
