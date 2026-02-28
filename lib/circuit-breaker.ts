// Circuit Breaker Mode — Per-category wrong-answer trip system
//
// 2 consecutive wrong answers in a category = "trip" (30 min cooldown)
// Auto-resets after cooldown expires
// Can spend 100W to reset immediately
// Tracks per-category stats: attempts, trips, streaks

import type { CategorySlug } from "@/types/question";

// ─── Constants ───────────────────────────────────────────────────────────────

export const TRIP_THRESHOLD = 2; // Consecutive wrong answers to trip
export const COOLDOWN_MINUTES = 30; // Minutes before auto-reset
export const RESET_COST = 100; // Watts to reset a tripped breaker
export const CLEAR_REWARD = 50; // Watts for clearing a breaker (correct after trip reset)

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BreakerState {
  categorySlug: string;
  consecutiveWrong: number;
  isTripped: boolean;
  trippedAt: Date | null;
  cooldownEndsAt: Date | null;
  totalAttempts: number;
  totalTrips: number;
  currentStreak: number;
  bestStreak: number;
}

export interface BreakerProcessResult {
  newConsecutiveWrong: number;
  justTripped: boolean;
  isTripped: boolean;
  cooldownEndsAt: Date | null;
  newStreak: number;
  bestStreak: number;
  totalTrips: number;
}

// ─── Core Logic ──────────────────────────────────────────────────────────────

/**
 * Process an answer and return the updated breaker state.
 * Does NOT write to DB — returns the values for the caller to persist.
 */
export function processAnswer(
  current: BreakerState,
  isCorrect: boolean
): BreakerProcessResult {
  let { consecutiveWrong, isTripped, currentStreak, bestStreak, totalTrips, cooldownEndsAt } = current;

  // If breaker is already tripped, don't process new answers
  if (isTripped && !isCooldownExpired(cooldownEndsAt)) {
    return {
      newConsecutiveWrong: consecutiveWrong,
      justTripped: false,
      isTripped: true,
      cooldownEndsAt,
      newStreak: currentStreak,
      bestStreak,
      totalTrips,
    };
  }

  // Auto-reset if cooldown has expired
  if (isTripped && isCooldownExpired(cooldownEndsAt)) {
    isTripped = false;
    consecutiveWrong = 0;
    cooldownEndsAt = null;
  }

  let justTripped = false;

  if (isCorrect) {
    consecutiveWrong = 0;
    currentStreak += 1;
    bestStreak = Math.max(currentStreak, bestStreak);
  } else {
    consecutiveWrong += 1;
    currentStreak = 0;

    // Check if this trips the breaker
    if (consecutiveWrong >= TRIP_THRESHOLD) {
      justTripped = true;
      isTripped = true;
      totalTrips += 1;
      const now = new Date();
      cooldownEndsAt = new Date(now.getTime() + COOLDOWN_MINUTES * 60 * 1000);
    }
  }

  return {
    newConsecutiveWrong: consecutiveWrong,
    justTripped,
    isTripped,
    cooldownEndsAt: isTripped ? cooldownEndsAt : null,
    newStreak: currentStreak,
    bestStreak,
    totalTrips,
  };
}

/**
 * Check if a breaker's cooldown has expired.
 */
export function isCooldownExpired(cooldownEndsAt: Date | null): boolean {
  if (!cooldownEndsAt) return true;
  return new Date() >= cooldownEndsAt;
}

/**
 * Check if a breaker is currently locked (tripped and cooldown not expired).
 */
export function isBreakerLocked(state: BreakerState): boolean {
  return state.isTripped && !isCooldownExpired(state.cooldownEndsAt);
}

/**
 * Get remaining cooldown time in seconds.
 * Returns 0 if cooldown has expired or breaker isn't tripped.
 */
export function getRemainingCooldown(cooldownEndsAt: Date | null): number {
  if (!cooldownEndsAt) return 0;
  const remaining = cooldownEndsAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(remaining / 1000));
}

/**
 * Format remaining seconds as "MM:SS".
 */
export function formatCooldown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Create a default breaker state for a category that has no record yet.
 */
export function createDefaultBreakerState(categorySlug: string): BreakerState {
  return {
    categorySlug,
    consecutiveWrong: 0,
    isTripped: false,
    trippedAt: null,
    cooldownEndsAt: null,
    totalAttempts: 0,
    totalTrips: 0,
    currentStreak: 0,
    bestStreak: 0,
  };
}

/**
 * Get a summary label for a breaker state.
 */
export function getBreakerStatusLabel(state: BreakerState): string {
  if (isBreakerLocked(state)) {
    const remaining = getRemainingCooldown(state.cooldownEndsAt);
    return `Tripped — ${formatCooldown(remaining)} remaining`;
  }
  if (state.consecutiveWrong === 1) {
    return "Warning — 1 wrong answer";
  }
  return "Active";
}

/**
 * Get the breaker status color class.
 */
export function getBreakerStatusColor(state: BreakerState): string {
  if (isBreakerLocked(state)) return "text-red-500";
  if (state.consecutiveWrong >= 1) return "text-amber";
  return "text-emerald dark:text-sparky-green";
}
