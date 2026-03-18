import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { db, userProgress, questionSrs, circuitBreakerState, quizResults } from "@/lib/db";
import { eq, and, sql, desc } from "drizzle-orm";
import { getQuestionById, getQuestionsByCategory } from "@/lib/questions";
import { CATEGORIES, type CategorySlug } from "@/types/question";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { category: categorySlug } = await params;
    const userId = session.user.id;

    // Validate category
    const category = CATEGORIES.find((c) => c.slug === categorySlug);
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Fetch progress, SRS, breaker state, and quiz results in parallel
    const [allProgress, allSrs, breakerState, recentQuizzes] = await Promise.all([
      db
        .select({
          questionId: userProgress.questionId,
          isCorrect: userProgress.isCorrect,
          answeredAt: userProgress.answeredAt,
        })
        .from(userProgress)
        .where(eq(userProgress.userId, userId)),
      db
        .select({
          questionId: questionSrs.questionId,
          easeFactor: questionSrs.easeFactor,
          interval: questionSrs.interval,
          nextReviewDate: questionSrs.nextReviewDate,
          timesCorrect: questionSrs.timesCorrect,
          timesWrong: questionSrs.timesWrong,
        })
        .from(questionSrs)
        .where(eq(questionSrs.userId, userId)),
      db
        .select()
        .from(circuitBreakerState)
        .where(
          and(
            eq(circuitBreakerState.userId, userId),
            eq(circuitBreakerState.categorySlug, categorySlug),
          ),
        )
        .limit(1),
      db
        .select({
          score: quizResults.score,
          totalQuestions: quizResults.totalQuestions,
          difficulty: quizResults.difficulty,
          completedAt: quizResults.completedAt,
        })
        .from(quizResults)
        .where(
          and(
            eq(quizResults.userId, userId),
            eq(quizResults.categorySlug, categorySlug),
          ),
        )
        .orderBy(desc(quizResults.completedAt))
        .limit(10),
    ]);

    // Filter progress for this category
    const categoryQuestionIds = new Set(
      getQuestionsByCategory(categorySlug as CategorySlug).map((q) => q.id),
    );

    const categoryProgress = allProgress.filter((p: any) => categoryQuestionIds.has(p.questionId));
    const categorySrs = allSrs.filter((s: any) => categoryQuestionIds.has(s.questionId));

    // Calculate stats
    const totalAnswered = categoryProgress.length;
    const totalCorrect = categoryProgress.filter((p: any) => p.isCorrect).length;
    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    // SRS stats
    const now = new Date();
    const srsHealthy = categorySrs.filter((s: any) => s.interval >= 7).length;
    const srsDue = categorySrs.filter((s: any) => s.nextReviewDate && s.nextReviewDate <= now).length;
    const srsHealth = categorySrs.length > 0
      ? Math.round((srsHealthy / categorySrs.length) * 100)
      : 0;

    // Recent accuracy trend (last 7 days vs previous 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const recentProgress = categoryProgress.filter(
      (p: any) => p.answeredAt && p.answeredAt >= sevenDaysAgo,
    );
    const prevProgress = categoryProgress.filter(
      (p: any) => p.answeredAt && p.answeredAt >= fourteenDaysAgo && p.answeredAt < sevenDaysAgo,
    );

    const recentAccuracy = recentProgress.length > 0
      ? Math.round(
          (recentProgress.filter((p: any) => p.isCorrect).length / recentProgress.length) * 100,
        )
      : null;
    const prevAccuracy = prevProgress.length > 0
      ? Math.round(
          (prevProgress.filter((p: any) => p.isCorrect).length / prevProgress.length) * 100,
        )
      : null;

    const trend =
      recentAccuracy !== null && prevAccuracy !== null
        ? recentAccuracy - prevAccuracy
        : null;

    // Per-question mastery breakdown
    const questionMastery = categorySrs.map((s: any) => {
      const question = getQuestionById(s.questionId);
      return {
        questionId: s.questionId,
        difficulty: question?.difficulty || "apprentice",
        easeFactor: s.easeFactor,
        interval: s.interval,
        isDue: s.nextReviewDate ? s.nextReviewDate <= now : false,
        timesCorrect: s.timesCorrect,
        timesWrong: s.timesWrong,
        mastery: s.interval >= 30 ? "mastered" : s.interval >= 7 ? "learning" : s.interval >= 1 ? "reviewing" : "new",
      };
    });

    const masteryBreakdown = {
      mastered: questionMastery.filter((q: any) => q.mastery === "mastered").length,
      learning: questionMastery.filter((q: any) => q.mastery === "learning").length,
      reviewing: questionMastery.filter((q: any) => q.mastery === "reviewing").length,
      new: questionMastery.filter((q: any) => q.mastery === "new").length,
      unattempted: categoryQuestionIds.size - categorySrs.length,
    };

    const breaker = breakerState[0] || null;

    return NextResponse.json({
      slug: category.slug,
      name: category.name,
      necArticle: category.necArticle || "",
      description: category.description,
      accuracy,
      totalAnswered,
      totalCorrect,
      totalQuestions: categoryQuestionIds.size,
      srsHealth,
      srsDue,
      srsTotal: categorySrs.length,
      recentAccuracy,
      prevAccuracy,
      trend,
      masteryBreakdown,
      recentQuizzes: recentQuizzes.map((q: any) => ({
        score: q.score,
        totalQuestions: q.totalQuestions,
        difficulty: q.difficulty,
        completedAt: q.completedAt?.toISOString() || null,
        percentage: Math.round((q.score / q.totalQuestions) * 100),
      })),
      breaker: breaker
        ? {
            isTripped: breaker.isTripped,
            currentStreak: breaker.currentStreak,
            bestStreak: breaker.bestStreak,
            totalTrips: breaker.totalTrips,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching power grid category:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
