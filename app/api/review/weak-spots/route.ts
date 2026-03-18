import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, questionSrs } from "@/lib/db";
import { sql } from "drizzle-orm";
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

    // 24-hour cooldown: exclude questions reviewed in the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const weakSpots = await db
      .select()
      .from(questionSrs)
      .where(
        sql`${questionSrs.userId} = ${userId} AND ${questionSrs.timesWrong} > 0 AND (${questionSrs.lastReviewDate} IS NULL OR ${questionSrs.lastReviewDate} <= ${Math.floor(twentyFourHoursAgo.getTime() / 1000)})`
      );

    // Sort by timesWrong DESC, then lastReviewDate ASC (least recently seen first)
    const sorted = weakSpots
      .map((srs: any) => {
        const question = getQuestionById(srs.questionId);
        if (!question) return null;

        return {
          questionId: srs.questionId,
          category: question.category,
          difficulty: question.difficulty,
          timesCorrect: srs.timesCorrect,
          timesWrong: srs.timesWrong,
          lastReviewDate: srs.lastReviewDate?.toISOString() || null,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => {
        // Primary: timesWrong DESC
        const wrongDiff = b!.timesWrong - a!.timesWrong;
        if (wrongDiff !== 0) return wrongDiff;
        // Tiebreaker: lastReviewDate ASC (null = never reviewed = highest priority)
        const aDate = a!.lastReviewDate ? new Date(a!.lastReviewDate).getTime() : 0;
        const bDate = b!.lastReviewDate ? new Date(b!.lastReviewDate).getTime() : 0;
        return aDate - bDate;
      })
      .slice(0, limit);

    return NextResponse.json({
      totalWeakSpots: weakSpots.length,
      questions: sorted,
    });
  } catch (error) {
    console.error("Error fetching weak spots:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
