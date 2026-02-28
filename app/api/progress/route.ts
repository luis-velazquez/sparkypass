import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users, userProgress, wattsTransactions, questionSrs, circuitBreakerState } from "@/lib/db";
import { eq, sql, and, count } from "drizzle-orm";
import crypto from "crypto";
import { calculateAnswerWatts } from "@/lib/watts";
import { calculateAmps, getDaysIdle } from "@/lib/amps";
import { deriveQuality, calculateNextReview, createDefaultSRSState } from "@/lib/spaced-repetition";
import { processAnswer, createDefaultBreakerState, TRIP_THRESHOLD } from "@/lib/circuit-breaker";
import { getQuestionById } from "@/lib/questions";
import type { VoltageTier, SRSQuality } from "@/types/reward-system";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { questionId, isCorrect, timeSpentSeconds, difficulty } = body;

    if (!questionId || typeof isCorrect !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields: questionId and isCorrect" },
        { status: 400 }
      );
    }

    // Generate unique ID for progress entry
    const progressId = crypto.randomUUID();

    // Get current user state
    const [currentUser] = await db
      .select({
        wattsBalance: users.wattsBalance,
        wattsLifetime: users.wattsLifetime,
        level: users.level,
        studyStreak: users.studyStreak,
        lastStudyDate: users.lastStudyDate,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    const voltageTier = (currentUser?.level || 1) as VoltageTier;

    // Calculate current amps
    const daysIdle = getDaysIdle(currentUser?.lastStudyDate || null);

    // Get questions answered in last 7 days for volume amps
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const [volumeResult] = await db
      .select({ count: count() })
      .from(userProgress)
      .where(
        sql`${userProgress.userId} = ${session.user.id} AND ${userProgress.answeredAt} >= ${sevenDaysAgo.getTime() / 1000}`
      );
    const questionsLast7Days = volumeResult?.count || 0;

    const ampsState = calculateAmps({
      streakDays: currentUser?.studyStreak || 0,
      questionsLast7Days,
      daysIdle,
    });

    // Insert progress record
    await db.insert(userProgress).values({
      id: progressId,
      userId: session.user.id,
      questionId,
      isCorrect,
      timeSpentSeconds: timeSpentSeconds || null,
      answeredAt: new Date(),
    });

    // If correct, award Watts and update user record
    let wattsEarned = 0;

    if (isCorrect) {
      wattsEarned = calculateAnswerWatts(difficulty, voltageTier, ampsState.totalAmps);

      const newBalance = (currentUser?.wattsBalance || 0) + wattsEarned;
      const newLifetime = (currentUser?.wattsLifetime || 0) + wattsEarned;

      await db
        .update(users)
        .set({
          wattsBalance: newBalance,
          wattsLifetime: newLifetime,
          xp: newLifetime,
          ampsBase: ampsState.totalAmps,
          ampsLastCalculated: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, session.user.id));

      // Log watts transaction
      await db.insert(wattsTransactions).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        type: "correct_answer",
        amount: wattsEarned,
        balanceAfter: newBalance,
        voltageAtTime: voltageTier,
        ampsAtTime: ampsState.totalAmps,
        description: `Correct answer (${difficulty || "journeyman"})`,
      });
    }

    // ─── Update SRS state ──────────────────────────────────────────────────
    let srsUpdated = false;
    try {
      const quality = deriveQuality(isCorrect, timeSpentSeconds ?? null);

      // Find existing SRS record
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
        // Update existing SRS record
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
        // Create new SRS record
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
      // SRS update failure should not block the main response
      console.error("Error updating SRS state:", srsError);
    }

    // ─── Update Circuit Breaker state ─────────────────────────────────────
    let breakerTripped = false;
    let breakerJustTripped = false;
    try {
      const question = getQuestionById(questionId);
      if (question) {
        const categorySlug = question.category;

        // Find or create breaker state for this category
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
      // Circuit breaker update failure should not block the main response
      console.error("Error updating circuit breaker state:", cbError);
    }

    // Get updated user state
    const [updatedUser] = await db
      .select({
        wattsBalance: users.wattsBalance,
        wattsLifetime: users.wattsLifetime,
        level: users.level,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    return NextResponse.json({
      success: true,
      progressId,
      wattsEarned,
      wattsBalance: updatedUser?.wattsBalance || 0,
      wattsLifetime: updatedUser?.wattsLifetime || 0,
      voltageTier: (updatedUser?.level || 1) as VoltageTier,
      currentAmps: ampsState.totalAmps,
      levelUp: null,
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
