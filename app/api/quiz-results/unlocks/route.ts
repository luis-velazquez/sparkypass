import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, quizResults } from "@/lib/db";
import { eq, and } from "drizzle-orm";

const UNLOCK_THRESHOLD = 70; // percentage needed to unlock next difficulty

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("category");

    if (!categorySlug) {
      return NextResponse.json({ error: "category is required" }, { status: 400 });
    }

    // Fetch all quiz results for this user + category
    const results = await db
      .select({
        difficulty: quizResults.difficulty,
        score: quizResults.score,
        totalQuestions: quizResults.totalQuestions,
      })
      .from(quizResults)
      .where(
        and(
          eq(quizResults.userId, session.user.id),
          eq(quizResults.categorySlug, categorySlug)
        )
      );

    // Compute best percentage per difficulty
    const bestByDifficulty: Record<string, number> = {};
    for (const r of results) {
      if (!r.difficulty) continue;
      const pct = Math.round((r.score / r.totalQuestions) * 100);
      if (!bestByDifficulty[r.difficulty] || pct > bestByDifficulty[r.difficulty]) {
        bestByDifficulty[r.difficulty] = pct;
      }
    }

    const journeymanBest = bestByDifficulty["journeyman"] ?? null;

    return NextResponse.json({
      apprentice: {
        unlocked: true,
        bestPercentage: bestByDifficulty["apprentice"] ?? null,
      },
      journeyman: {
        unlocked: true,
        bestPercentage: journeymanBest,
      },
      master: {
        unlocked: journeymanBest !== null && journeymanBest >= UNLOCK_THRESHOLD,
        bestPercentage: bestByDifficulty["master"] ?? null,
      },
    });
  } catch (error) {
    console.error("Error fetching unlock status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
