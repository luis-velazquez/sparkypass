import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, questionSrs } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getOverdueDays, calculateReviewPriority } from "@/lib/spaced-repetition";
import { getQuestionById } from "@/lib/questions";
import { CATEGORIES } from "@/types/question";

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

    // Calculate priority for each due question and enrich with question data
    const prioritized = dueQuestions
      .map((srs: any) => {
        const question = getQuestionById(srs.questionId);
        if (!question) return null;

        // Apply category filter if specified
        if (categoryFilter && question.category !== categoryFilter) return null;

        const overdueDays = getOverdueDays(srs.nextReviewDate!);

        // Simplified priority: overdue days + ease factor weighting
        const priority = calculateReviewPriority({
          overdueDays,
          categoryAmps: 5, // Neutral value — amps no longer used for prioritization
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
      .sort((a: any, b: any) => b!.priority - a!.priority)
      .slice(0, limit);

    // Count total due (unfiltered)
    const totalDue = dueQuestions.length;

    // Count by category
    const dueByCategoryMap: Record<string, number> = {};
    dueQuestions.forEach((srs: any) => {
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
