import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getUserClassification, getClassificationTitle } from "@/lib/voltage";
import { isStreakSkipAvailable, streakSkipResetsAt } from "@/lib/streak";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select({
        name: users.name,
        email: users.email,
        username: users.username,
        wattsBalance: users.wattsBalance,
        wattsLifetime: users.wattsLifetime,
        studyStreak: users.studyStreak,
        streakSkipUsedAt: users.streakSkipUsedAt,
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

    const classification = getUserClassification(user.wattsBalance).classification;
    const classificationTitle = getClassificationTitle(user.wattsBalance);

    const now = new Date();

    return NextResponse.json({
      name: user.name,
      email: user.email,
      username: user.username,
      wattsBalance: user.wattsBalance,
      wattsLifetime: user.wattsLifetime,
      classification,
      classificationTitle,
      studyStreak: user.studyStreak,
      // Free weekly streak-skip status (auto-forgives one missed day per 7 days).
      streakSkipAvailable: isStreakSkipAvailable(user.streakSkipUsedAt, now),
      streakSkipResetsAt: streakSkipResetsAt(user.streakSkipUsedAt, now),
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
