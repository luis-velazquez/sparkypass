import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, questionSrs, userProgress } from "@/lib/db";
import { eq, lte, sql, count } from "drizzle-orm";
import { getOverdueDays, calculateReviewPriority } from "@/lib/spaced-repetition";
import { calculateAmps, getDaysIdle } from "@/lib/amps";
import { getQuestionById } from "@/lib/questions";
import { CATEGORIES } from "@/types/question";
import { users } from "@/lib/db/schema";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 50) : 20;
    const categoryFilter = searchParams.get("category");

    // Get all SRS records that are due (nextReviewDate <= now)
    const now = new Date();
    const dueQuestions = await db
      .select()
      .from(questionSrs)
      .where(
        sql`${questionSrs.userId} = ${userId} AND ${questionSrs.nextReviewDate} <= ${Math.floor(now.getTime() / 1000)}`
      );

    // Get user amps data for category-level prioritization
    const [user] = await db
      .select({
        studyStreak: users.studyStreak,
        lastStudyDate: users.lastStudyDate,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const daysIdle = getDaysIdle(user?.lastStudyDate || null);

    // Get questions answered in last 7 days for volume amps
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const [volumeResult] = await db
      .select({ count: count() })
      .from(userProgress)
      .where(
        sql`${userProgress.userId} = ${userId} AND ${userProgress.answeredAt} >= ${Math.floor(sevenDaysAgo.getTime() / 1000)}`
      );

    const ampsState = calculateAmps({
      streakDays: user?.studyStreak || 0,
      questionsLast7Days: volumeResult?.count || 0,
      daysIdle,
    });

    // Build category amps map (simplified — using overall amps as base, could refine per-category)
    const categoryAmps: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      categoryAmps[cat.slug] = ampsState.totalAmps / 10; // Normalize to 0-10 range
    }

    // Calculate priority for each due question and enrich with question data
    const prioritized = dueQuestions
      .map((srs) => {
        const question = getQuestionById(srs.questionId);
        if (!question) return null;

        // Apply category filter if specified
        if (categoryFilter && question.category !== categoryFilter) return null;

        const overdueDays = getOverdueDays(srs.nextReviewDate!);
        const catAmps = categoryAmps[question.category] ?? 5;

        const priority = calculateReviewPriority({
          overdueDays,
          categoryAmps: catAmps,
          easeFactor: srs.easeFactor,
        });

        return {
          questionId: srs.questionId,
          category: question.category,
          difficulty: question.difficulty,
          easeFactor: srs.easeFactor,
          interval: srs.interval,
          overdueDays,
          timesCorrect: srs.timesCorrect,
          timesWrong: srs.timesWrong,
          lastReviewDate: srs.lastReviewDate?.toISOString() || null,
          priority,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.priority - a!.priority)
      .slice(0, limit);

    // Count total due (unfiltered)
    const totalDue = dueQuestions.length;

    // Count by category
    const dueByCategoryMap: Record<string, number> = {};
    dueQuestions.forEach((srs) => {
      const question = getQuestionById(srs.questionId);
      if (!question) return;
      dueByCategoryMap[question.category] = (dueByCategoryMap[question.category] || 0) + 1;
    });

    const dueByCategory = Object.entries(dueByCategoryMap).map(([slug, count]) => ({
      slug,
      count,
    }));

    return NextResponse.json({
      totalDue,
      dueByCategory,
      questions: prioritized,
    });
  } catch (error) {
    console.error("Error fetching due reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
