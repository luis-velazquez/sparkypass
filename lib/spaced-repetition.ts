// Spaced Repetition System — SM-2 hybrid with wrong-answer emphasis
//
// Quality scale:
//   5 — Perfect, fast response (correct, < 10s)
//   4 — Correct, with hesitation (correct, 10-30s)
//   3 — Correct, slow or after recall difficulty (correct, > 30s)
//   2 — Wrong but close (wrong, had some knowledge)
//   1 — Wrong, vaguely remembered
//   0 — Complete blackout (wrong, no idea)

import type { SRSQuality, SRSUpdate } from "@/types/reward-system";

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;
const MAX_INTERVAL_DAYS = 180;
const INITIAL_INTERVALS = [1, 3]; // Day 1, Day 3, then N × ease

// ─── Quality Derivation ─────────────────────────────────────────────────────

/**
 * Derive SM-2 quality (0-5) from answer correctness and time spent.
 */
export function deriveQuality(isCorrect: boolean, timeSpentSeconds: number | null): SRSQuality {
  const time = timeSpentSeconds ?? 15; // Default to mid-range if unknown

  if (isCorrect) {
    if (time < 10) return 5;   // Fast and correct
    if (time <= 30) return 4;  // Correct with some thought
    return 3;                   // Correct but slow
  }

  // Wrong answers: could refine with answer similarity in future
  if (time > 20) return 1;     // Thought about it but still wrong
  return 0;                     // Quick wrong = blackout
}

// ─── SM-2 Core Algorithm ─────────────────────────────────────────────────────

/**
 * Calculate the next SRS state after a review.
 *
 * For wrong answers (quality < 3):
 *   - Reset repetitions to 0
 *   - Set interval to 1 day
 *   - Decrease ease factor (floor 1.30)
 *
 * For correct answers (quality >= 3):
 *   - SM-2 interval progression: 1 → 3 → N × ease_factor
 *   - Adjust ease factor based on quality
 */
export function calculateNextReview(params: {
  quality: SRSQuality;
  currentEaseFactor: number;
  currentInterval: number;
  currentRepetitions: number;
}): SRSUpdate {
  const { quality, currentEaseFactor, currentInterval, currentRepetitions } = params;

  let newEaseFactor = currentEaseFactor;
  let newInterval: number;
  let newRepetitions: number;

  if (quality < 3) {
    // Wrong answer — reset
    newRepetitions = 0;
    newInterval = 1;
    // Decrease ease factor more aggressively for lower quality
    newEaseFactor = Math.max(
      MIN_EASE_FACTOR,
      currentEaseFactor - (0.2 + (3 - quality) * 0.08)
    );
  } else {
    // Correct answer — advance
    newRepetitions = currentRepetitions + 1;

    if (newRepetitions <= INITIAL_INTERVALS.length) {
      newInterval = INITIAL_INTERVALS[newRepetitions - 1];
    } else {
      newInterval = Math.round(currentInterval * currentEaseFactor);
    }

    // SM-2 ease factor adjustment
    newEaseFactor = currentEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    newEaseFactor = Math.max(MIN_EASE_FACTOR, newEaseFactor);
  }

  // Cap interval
  newInterval = Math.min(newInterval, MAX_INTERVAL_DAYS);

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  return {
    easeFactor: Math.round(newEaseFactor * 100) / 100,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewDate,
  };
}

// ─── Time Decay ──────────────────────────────────────────────────────────────

/**
 * Calculate how many days a question is overdue.
 * Positive = overdue, negative = not yet due, 0 = due today.
 */
export function getOverdueDays(nextReviewDate: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const review = new Date(nextReviewDate);
  review.setHours(0, 0, 0, 0);
  return Math.floor((now.getTime() - review.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * For overdue questions, shrink the effective interval proportionally.
 * This means that if you let a question lapse for a long time,
 * it acts as if the interval were shorter (i.e., it needs review sooner).
 *
 * Returns the effective interval considering overdue decay.
 */
export function getEffectiveInterval(interval: number, overdueDays: number): number {
  if (overdueDays <= 0) return interval;

  // The more overdue, the more the interval shrinks
  // At 2x overdue, interval is halved; at 3x, it's a third, etc.
  const overdueRatio = overdueDays / Math.max(interval, 1);
  const shrinkFactor = 1 / (1 + overdueRatio);
  return Math.max(1, Math.round(interval * shrinkFactor));
}

// ─── Priority Sorting ────────────────────────────────────────────────────────

/**
 * Calculate review priority for a question.
 * Higher priority = should be reviewed first.
 *
 * Formula: overdue_days × 3 + (10 - category_amps) × 2 + (300 - ease_factor) / 50
 *
 * - Overdue questions get highest priority
 * - Low-amps categories (weak areas) get higher priority
 * - Lower ease factors (harder questions) get higher priority
 */
export function calculateReviewPriority(params: {
  overdueDays: number;
  categoryAmps: number;
  easeFactor: number;
}): number {
  const { overdueDays, categoryAmps, easeFactor } = params;

  const overdueScore = Math.max(0, overdueDays) * 3;
  const categoryScore = (10 - Math.min(categoryAmps, 10)) * 2;
  const difficultyScore = (300 - Math.round(easeFactor * 100)) / 50;

  return Math.round((overdueScore + categoryScore + difficultyScore) * 100) / 100;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Create default SRS state for a new question.
 */
export function createDefaultSRSState(): {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
} {
  return {
    easeFactor: DEFAULT_EASE_FACTOR,
    interval: 0,
    repetitions: 0,
    nextReviewDate: new Date(), // Due immediately
  };
}

/**
 * Create initial SRS state from existing attempt history.
 * Used by the seeding script to bootstrap SRS from userProgress.
 */
export function seedSRSFromHistory(attempts: Array<{ isCorrect: boolean; answeredAt: Date }>): {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
  timesCorrect: number;
  timesWrong: number;
} {
  if (attempts.length === 0) {
    return {
      ...createDefaultSRSState(),
      timesCorrect: 0,
      timesWrong: 0,
    };
  }

  // Sort by date ascending
  const sorted = [...attempts].sort((a, b) => a.answeredAt.getTime() - b.answeredAt.getTime());

  let easeFactor = DEFAULT_EASE_FACTOR;
  let interval = 0;
  let repetitions = 0;
  let timesCorrect = 0;
  let timesWrong = 0;

  // Replay attempts through the SM-2 algorithm
  for (const attempt of sorted) {
    if (attempt.isCorrect) {
      timesCorrect++;
    } else {
      timesWrong++;
    }

    const quality = attempt.isCorrect ? 4 : 1; // Simplified quality for seeding
    const result = calculateNextReview({
      quality: quality as SRSQuality,
      currentEaseFactor: easeFactor,
      currentInterval: interval,
      currentRepetitions: repetitions,
    });

    easeFactor = result.easeFactor;
    interval = result.interval;
    repetitions = result.repetitions;
  }

  // Set next review based on last attempt date + interval
  const lastAttempt = sorted[sorted.length - 1];
  const nextReviewDate = new Date(lastAttempt.answeredAt);
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    easeFactor,
    interval,
    repetitions,
    nextReviewDate,
    timesCorrect,
    timesWrong,
  };
}
