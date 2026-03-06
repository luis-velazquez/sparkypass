import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users, userProgress, questionSrs, circuitBreakerState } from "@/lib/db";
import { eq, sql, and } from "drizzle-orm";
import crypto from "crypto";
import { deriveQuality, calculateNextReview, createDefaultSRSState } from "@/lib/spaced-repetition";
import { processAnswer, createDefaultBreakerState } from "@/lib/circuit-breaker";
import { getQuestionById } from "@/lib/questions";
import type { SRSQuality } from "@/types/reward-system";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { questionId, isCorrect, timeSpentSeconds } = body;

    if (!questionId || typeof isCorrect !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields: questionId and isCorrect" },
        { status: 400 }
      );
    }

    const progressId = crypto.randomUUID();

    // Insert progress record
    await db.insert(userProgress).values({
      id: progressId,
      userId: session.user.id,
      questionId,
      isCorrect,
      timeSpentSeconds: timeSpentSeconds || null,
      answeredAt: new Date(),
    });

    // ─── Update SRS state ──────────────────────────────────────────────────
    let srsUpdated = false;
    try {
      const quality = deriveQuality(isCorrect, timeSpentSeconds ?? null);

      const [existingSrs] = await db
        .select()
        .from(questionSrs)
        .where(
          and(
            eq(questionSrs.userId, session.user.id),
            eq(questionSrs.questionId, questionId)
          )
        )
        .limit(1);

      if (existingSrs) {
        const update = calculateNextReview({
          quality: quality as SRSQuality,
          currentEaseFactor: existingSrs.easeFactor,
          currentInterval: existingSrs.interval,
          currentRepetitions: existingSrs.repetitions,
        });

        await db
          .update(questionSrs)
          .set({
            easeFactor: update.easeFactor,
            interval: update.interval,
            repetitions: update.repetitions,
            nextReviewDate: update.nextReviewDate,
            lastReviewDate: new Date(),
            timesCorrect: isCorrect
              ? sql`${questionSrs.timesCorrect} + 1`
              : existingSrs.timesCorrect,
            timesWrong: !isCorrect
              ? sql`${questionSrs.timesWrong} + 1`
              : existingSrs.timesWrong,
          })
          .where(eq(questionSrs.id, existingSrs.id));

        srsUpdated = true;
      } else {
        const defaults = createDefaultSRSState();
        const update = calculateNextReview({
          quality: quality as SRSQuality,
          currentEaseFactor: defaults.easeFactor,
          currentInterval: defaults.interval,
          currentRepetitions: defaults.repetitions,
        });

        await db.insert(questionSrs).values({
          id: crypto.randomUUID(),
          userId: session.user.id,
          questionId,
          easeFactor: update.easeFactor,
          interval: update.interval,
          repetitions: update.repetitions,
          nextReviewDate: update.nextReviewDate,
          lastReviewDate: new Date(),
          timesCorrect: isCorrect ? 1 : 0,
          timesWrong: isCorrect ? 0 : 1,
        });

        srsUpdated = true;
      }
    } catch (srsError) {
      console.error("Error updating SRS state:", srsError);
    }

    // ─── Update Circuit Breaker state ─────────────────────────────────────
    let breakerTripped = false;
    let breakerJustTripped = false;
    try {
      const question = getQuestionById(questionId);
      if (question) {
        const categorySlug = question.category;

        const [existingBreaker] = await db
          .select()
          .from(circuitBreakerState)
          .where(
            and(
              eq(circuitBreakerState.userId, session.user.id),
              eq(circuitBreakerState.categorySlug, categorySlug)
            )
          )
          .limit(1);

        const currentState = existingBreaker
          ? {
              categorySlug,
              consecutiveWrong: existingBreaker.consecutiveWrong,
              isTripped: existingBreaker.isTripped,
              trippedAt: existingBreaker.trippedAt,
              cooldownEndsAt: existingBreaker.cooldownEndsAt,
              totalAttempts: existingBreaker.totalAttempts,
              totalTrips: existingBreaker.totalTrips,
              currentStreak: existingBreaker.currentStreak,
              bestStreak: existingBreaker.bestStreak,
            }
          : createDefaultBreakerState(categorySlug);

        const result = processAnswer(currentState, isCorrect);

        if (existingBreaker) {
          await db
            .update(circuitBreakerState)
            .set({
              consecutiveWrong: result.newConsecutiveWrong,
              isTripped: result.isTripped,
              trippedAt: result.justTripped ? new Date() : existingBreaker.trippedAt,
              cooldownEndsAt: result.cooldownEndsAt,
              totalAttempts: existingBreaker.totalAttempts + 1,
              totalTrips: result.totalTrips,
              currentStreak: result.newStreak,
              bestStreak: result.bestStreak,
            })
            .where(eq(circuitBreakerState.id, existingBreaker.id));
        } else {
          await db.insert(circuitBreakerState).values({
            id: crypto.randomUUID(),
            userId: session.user.id,
            categorySlug,
            consecutiveWrong: result.newConsecutiveWrong,
            isTripped: result.isTripped,
            trippedAt: result.justTripped ? new Date() : null,
            cooldownEndsAt: result.cooldownEndsAt,
            totalAttempts: 1,
            totalTrips: result.totalTrips,
            currentStreak: result.newStreak,
            bestStreak: result.bestStreak,
          });
        }

        breakerTripped = result.isTripped;
        breakerJustTripped = result.justTripped;
      }
    } catch (cbError) {
      console.error("Error updating circuit breaker state:", cbError);
    }

    return NextResponse.json({
      success: true,
      progressId,
      srsUpdated,
      breakerTripped,
      breakerJustTripped,
    });
  } catch (error) {
    console.error("Error saving progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
