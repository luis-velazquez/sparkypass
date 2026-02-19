import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users, userProgress, studySessions } from "@/lib/db";
import { eq, sql, count, and, gte, countDistinct, isNotNull } from "drizzle-orm";
import { getTotalQuestionCount, getQuestionById } from "@/lib/questions";
import { CATEGORIES } from "@/types/question";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get total questions answered, unique questions, and accuracy
    const [overallStats] = await db
      .select({
        totalAnswered: count(),
        uniqueQuestionsAnswered: countDistinct(userProgress.questionId),
        correctCount: sql<number>`SUM(CASE WHEN ${userProgress.isCorrect} = 1 THEN 1 ELSE 0 END)`,
      })
      .from(userProgress)
      .where(eq(userProgress.userId, userId));

    // Get questions answered today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayStats] = await db
      .select({
        answeredToday: count(),
      })
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, userId),
          gte(userProgress.answeredAt, today)
        )
      );

    // Check if today's daily challenge is completed
    const [dailyStatus] = await db
      .select({ id: studySessions.id, xpEarned: studySessions.xpEarned })
      .from(studySessions)
      .where(and(
        eq(studySessions.userId, userId),
        eq(studySessions.sessionType, "daily_challenge"),
        gte(studySessions.startedAt, today),
        isNotNull(studySessions.endedAt)
      ))
      .limit(1);

    // Daily challenge XP reward schedule (Sun=0 → Day 1, Sat=6 → Day 7)
    const dailyXpSchedule = [25, 30, 30, 30, 50, 75, 100];
    const dailyChallengeXpReward = dailyXpSchedule[new Date().getDay()];

    // Get category breakdown - we'll extract category from questionId prefix
    const categoryProgress = await db
      .select({
        questionId: userProgress.questionId,
        isCorrect: userProgress.isCorrect,
      })
      .from(userProgress)
      .where(eq(userProgress.userId, userId));

    // Group by category using actual question data
    const categoryStats: Record<
      string,
      { answered: number; correct: number }
    > = {};
    for (const cat of CATEGORIES) {
      categoryStats[cat.slug] = { answered: 0, correct: 0 };
    }

    categoryProgress.forEach((p) => {
      const question = getQuestionById(p.questionId);
      if (!question) return;
      const category = question.category;

      if (!categoryStats[category]) {
        categoryStats[category] = { answered: 0, correct: 0 };
      }
      categoryStats[category].answered++;
      if (p.isCorrect) {
        categoryStats[category].correct++;
      }
    });

    // Get recent study sessions
    const recentSessions = await db
      .select({
        id: studySessions.id,
        sessionType: studySessions.sessionType,
        categorySlug: studySessions.categorySlug,
        questionsAnswered: studySessions.questionsAnswered,
        questionsCorrect: studySessions.questionsCorrect,
        startedAt: studySessions.startedAt,
        endedAt: studySessions.endedAt,
        xpEarned: studySessions.xpEarned,
      })
      .from(studySessions)
      .where(eq(studySessions.userId, userId))
      .orderBy(sql`${studySessions.startedAt} DESC`)
      .limit(5);

    // Get user XP and level
    const [user] = await db
      .select({
        xp: users.xp,
        level: users.level,
        studyStreak: users.studyStreak,
        bestStudyStreak: users.bestStudyStreak,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const totalAnswered = overallStats?.totalAnswered || 0;
    const uniqueQuestionsAnswered = overallStats?.uniqueQuestionsAnswered || 0;
    const correctCount = overallStats?.correctCount || 0;
    const accuracy =
      totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

    return NextResponse.json({
      totalAnswered,
      uniqueQuestionsAnswered,
      totalQuestionsInBank: getTotalQuestionCount(),
      correctCount,
      accuracy,
      answeredToday: todayStats?.answeredToday || 0,
      categoryStats: Object.entries(categoryStats).map(([slug, stats]) => ({
        slug,
        answered: stats.answered,
        correct: stats.correct,
        accuracy:
          stats.answered > 0
            ? Math.round((stats.correct / stats.answered) * 100)
            : 0,
      })),
      recentSessions: recentSessions.map((s) => ({
        id: s.id,
        sessionType: s.sessionType,
        categorySlug: s.categorySlug || null,
        questionsAnswered: s.questionsAnswered ?? null,
        questionsCorrect: s.questionsCorrect ?? null,
        startedAt: s.startedAt?.toISOString() || null,
        endedAt: s.endedAt?.toISOString() || null,
        xpEarned: s.xpEarned,
      })),
      xp: user?.xp || 0,
      level: user?.level || 1,
      studyStreak: user?.studyStreak || 0,
      bestStudyStreak: user?.bestStudyStreak || 0,
      dailyChallengeCompleted: !!dailyStatus,
      dailyChallengeXpEarned: dailyStatus?.xpEarned ?? 0,
      dailyChallengeXpReward,
    });
  } catch (error) {
    console.error("Error fetching progress stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
