import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users, userProgress, quizResults, studySessions } from "@/lib/db";
import { eq, sql, count, and } from "drizzle-orm";
import { calculateVoltageTier, getVoltageTierProgress, checkVoltageAdvancement } from "@/lib/voltage";
import { CATEGORIES } from "@/types/question";
import { getQuestionById } from "@/lib/questions";
import type { VoltageTier } from "@/types/reward-system";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get total questions answered
    const [totalResult] = await db
      .select({ count: count() })
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
    const totalQuestions = totalResult?.count || 0;

    // Get completed mock exams
    const [mockResult] = await db
      .select({ count: count() })
      .from(studySessions)
      .where(
        and(
          eq(studySessions.userId, userId),
          eq(studySessions.sessionType, "mock_exam"),
          sql`${studySessions.endedAt} IS NOT NULL`
        )
      );
    const mockExams = mockResult?.count || 0;

    // Calculate categories at each difficulty level (≥70% accuracy with ≥10 questions)
    const categoryProgress = await db
      .select({
        questionId: userProgress.questionId,
        isCorrect: userProgress.isCorrect,
      })
      .from(userProgress)
      .where(eq(userProgress.userId, userId));

    // Build per-category, per-difficulty stats
    const catDiffStats: Record<string, Record<string, { correct: number; total: number }>> = {};

    categoryProgress.forEach((p) => {
      const question = getQuestionById(p.questionId);
      if (!question) return;

      const cat = question.category;
      const diff = question.difficulty;

      if (!catDiffStats[cat]) catDiffStats[cat] = {};
      if (!catDiffStats[cat][diff]) catDiffStats[cat][diff] = { correct: 0, total: 0 };

      catDiffStats[cat][diff].total++;
      if (p.isCorrect) catDiffStats[cat][diff].correct++;
    });

    // Count categories at each difficulty threshold (≥70% accuracy, ≥10 questions)
    let categoriesAtApprentice = 0;
    let categoriesAtJourneyman = 0;
    let categoriesAtMaster = 0;

    for (const cat of CATEGORIES) {
      const stats = catDiffStats[cat.slug] || {};

      const apprentice = stats.apprentice || { correct: 0, total: 0 };
      const journeyman = stats.journeyman || { correct: 0, total: 0 };
      const master = stats.master || { correct: 0, total: 0 };

      if (apprentice.total >= 10 && (apprentice.correct / apprentice.total) >= 0.7) {
        categoriesAtApprentice++;
      }
      if (journeyman.total >= 10 && (journeyman.correct / journeyman.total) >= 0.7) {
        categoriesAtJourneyman++;
      }
      if (master.total >= 10 && (master.correct / master.total) >= 0.7) {
        categoriesAtMaster++;
      }
    }

    const stats = {
      categoriesAtApprentice,
      categoriesAtJourneyman,
      categoriesAtMaster,
      totalQuestions,
      mockExams,
    };

    const newTier = calculateVoltageTier(stats);
    const progress = getVoltageTierProgress(newTier, stats);

    // Get current stored tier
    const [user] = await db
      .select({ level: users.level })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const currentStoredTier = (user?.level || 1) as VoltageTier;
    const advancement = checkVoltageAdvancement(currentStoredTier, newTier);

    // Update tier if advanced
    if (advancement) {
      await db
        .update(users)
        .set({
          level: newTier,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }

    return NextResponse.json({
      ...progress,
      advancement,
      stats,
    });
  } catch (error) {
    console.error("Error fetching voltage data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
