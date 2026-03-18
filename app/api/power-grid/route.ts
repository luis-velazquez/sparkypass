import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users, userProgress, questionSrs, circuitBreakerState } from "@/lib/db";
import { eq, sql, count, and, lt } from "drizzle-orm";
import { getQuestionById, getQuestionsByCategory } from "@/lib/questions";
import { CATEGORIES } from "@/types/question";

export type PowerGridStatus = "energized" | "browned-out" | "de-energized" | "flickering";

export interface PowerGridCategory {
  slug: string;
  name: string;
  necArticle: string;
  status: PowerGridStatus;
  accuracy: number;
  totalAnswered: number;
  totalCorrect: number;
  totalQuestions: number;
  srsHealth: number;
  srsDue: number;
  srsTotal: number;
  bestStreak: number;
  breakerTripped: boolean;
  recentWrong: boolean;
}

export interface PowerGridResponse {
  categories: PowerGridCategory[];
  overallProgress: number;
  energizedCount: number;
  brownedOutCount: number;
  deEnergizedCount: number;
  flickeringCount: number;
}

function computeStatus(
  accuracy: number,
  totalAnswered: number,
  srsHealth: number,
  recentWrong: boolean,
): PowerGridStatus {
  // De-energized: never attempted or < 5 questions
  if (totalAnswered < 5) return "de-energized";

  // Flickering: recent wrong on previously energized topic
  if (recentWrong && accuracy >= 75 && totalAnswered >= 10) return "flickering";

  // Energized: accuracy >= 75%, 10+ questions, SRS health > 70%
  if (accuracy >= 75 && totalAnswered >= 10 && srsHealth > 70) return "energized";

  // Browned Out: accuracy 50-75% or SRS health 30-70%
  if (accuracy >= 50 || (totalAnswered >= 5 && srsHealth >= 30)) return "browned-out";

  // De-energized for very low accuracy with few questions
  return "de-energized";
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch all user progress, SRS states, and breaker states in parallel
    const [allProgress, allSrs, allBreakers] = await Promise.all([
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
          interval: questionSrs.interval,
          nextReviewDate: questionSrs.nextReviewDate,
        })
        .from(questionSrs)
        .where(eq(questionSrs.userId, userId)),
      db
        .select({
          categorySlug: circuitBreakerState.categorySlug,
          isTripped: circuitBreakerState.isTripped,
          bestStreak: circuitBreakerState.bestStreak,
        })
        .from(circuitBreakerState)
        .where(eq(circuitBreakerState.userId, userId)),
    ]);

    // Group progress by category
    const categoryProgress: Record<string, { answered: number; correct: number; recentWrong: boolean }> = {};
    for (const cat of CATEGORIES) {
      categoryProgress[cat.slug] = { answered: 0, correct: 0, recentWrong: false };
    }

    // Track recent wrong answers (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    allProgress.forEach((p: any) => {
      const question = getQuestionById(p.questionId);
      if (!question) return;
      const cat = question.category;
      if (!categoryProgress[cat]) {
        categoryProgress[cat] = { answered: 0, correct: 0, recentWrong: false };
      }
      categoryProgress[cat].answered++;
      if (p.isCorrect) {
        categoryProgress[cat].correct++;
      } else if (p.answeredAt && p.answeredAt >= oneDayAgo) {
        categoryProgress[cat].recentWrong = true;
      }
    });

    // Group SRS by category
    const categorySrs: Record<string, { total: number; healthy: number; due: number }> = {};
    const now = new Date();

    allSrs.forEach((s: any) => {
      const question = getQuestionById(s.questionId);
      if (!question) return;
      const cat = question.category;
      if (!categorySrs[cat]) {
        categorySrs[cat] = { total: 0, healthy: 0, due: 0 };
      }
      categorySrs[cat].total++;
      // Healthy = interval >= 7 days (question is well-learned)
      if (s.interval >= 7) {
        categorySrs[cat].healthy++;
      }
      // Due = next review date is in the past
      if (s.nextReviewDate && s.nextReviewDate <= now) {
        categorySrs[cat].due++;
      }
    });

    // Index breaker states
    const breakerMap: Record<string, { isTripped: boolean; bestStreak: number }> = {};
    allBreakers.forEach((b: any) => {
      breakerMap[b.categorySlug] = {
        isTripped: b.isTripped,
        bestStreak: b.bestStreak,
      };
    });

    // Build category data
    const categories: PowerGridCategory[] = CATEGORIES.map((cat) => {
      const progress = categoryProgress[cat.slug] || { answered: 0, correct: 0, recentWrong: false };
      const srs = categorySrs[cat.slug] || { total: 0, healthy: 0, due: 0 };
      const breaker = breakerMap[cat.slug];
      const totalQuestions = getQuestionsByCategory(cat.slug).length;
      const accuracy = progress.answered > 0
        ? Math.round((progress.correct / progress.answered) * 100)
        : 0;
      const srsHealth = srs.total > 0
        ? Math.round((srs.healthy / srs.total) * 100)
        : 0;

      const status = computeStatus(accuracy, progress.answered, srsHealth, progress.recentWrong);

      return {
        slug: cat.slug,
        name: cat.name,
        necArticle: cat.necArticle || "",
        status,
        accuracy,
        totalAnswered: progress.answered,
        totalCorrect: progress.correct,
        totalQuestions,
        srsHealth,
        srsDue: srs.due,
        srsTotal: srs.total,
        bestStreak: breaker?.bestStreak || 0,
        breakerTripped: breaker?.isTripped || false,
        recentWrong: progress.recentWrong,
      };
    });

    const energizedCount = categories.filter((c) => c.status === "energized").length;
    const brownedOutCount = categories.filter((c) => c.status === "browned-out").length;
    const deEnergizedCount = categories.filter((c) => c.status === "de-energized").length;
    const flickeringCount = categories.filter((c) => c.status === "flickering").length;

    // Overall progress: weighted average of all categories
    const totalAnsweredAll = categories.reduce((sum, c) => sum + c.totalAnswered, 0);
    const totalCorrectAll = categories.reduce((sum, c) => sum + c.totalCorrect, 0);
    const overallProgress = totalAnsweredAll > 0
      ? Math.round((totalCorrectAll / totalAnsweredAll) * 100)
      : 0;

    return NextResponse.json({
      categories,
      overallProgress,
      energizedCount,
      brownedOutCount,
      deEnergizedCount,
      flickeringCount,
    } satisfies PowerGridResponse);
  } catch (error) {
    console.error("Error fetching power grid:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
