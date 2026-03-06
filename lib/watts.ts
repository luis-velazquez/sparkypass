// Watts (W = V × I) — Currency system
// Watts are earned on actions and spent on power-ups

import type { Difficulty } from "@/types/question";
import type { PowerUpType, QuizVoltage } from "@/types/reward-system";

// ─── Activity Voltages ──────────────────────────────────────────────────────

export const ACTIVITY_VOLTAGE: Record<string, QuizVoltage> = {
  daily_challenge: 277,
  review: 277,
  circuit_breaker: 480,
};

export const INDEX_GAME_WATTS_PER_CORRECT = 12;

// ─── Resistance Penalties ───────────────────────────────────────────────────

export const RESISTANCE_PENALTIES = {
  no_login: 120, // per missed day
  missed_review: 120, // once per login if overdue SRS exist
};

// ─── Pass/Fail ──────────────────────────────────────────────────────────────

export const PASS_THRESHOLD = 0.7;

// ─── Streak milestone rewards ───────────────────────────────────────────────

export const STREAK_WATTS_MILESTONES: Record<number, number> = {
  3: 50,
  7: 100,
  14: 200,
  21: 400,
  30: 800,
};

// ─── Power-up Costs ──────────────────────────────────────────────────────────

export const POWER_UP_COSTS: Record<PowerUpType, number> = {
  streak_fuse: 200,
  formula_sheet: 150,
  breaker_reset: 100,
};

// ─── Watts Calculation ───────────────────────────────────────────────────────

/**
 * Calculate total watts from an array of voltages earned per correct answer.
 * Each correct answer = 1 amp, so watts per answer = voltage × 1 = voltage.
 * If quiz is failed (<70%), each answer counts as 0.5 amps (half watts).
 */
export function calculateQuizTotal(
  correctVoltages: number[],
  passed: boolean
): number {
  const rawWatts = correctVoltages.reduce((sum, v) => sum + v, 0);
  return passed ? rawWatts : Math.round(rawWatts * 0.5);
}

/**
 * Get streak milestone reward if the current streak is a milestone.
 */
export function getStreakMilestoneReward(streakDays: number): number | null {
  return STREAK_WATTS_MILESTONES[streakDays] ?? null;
}

/**
 * Check if user can afford a power-up.
 */
export function canAffordPowerUp(wattsBalance: number, powerUpType: PowerUpType): boolean {
  return wattsBalance >= POWER_UP_COSTS[powerUpType];
}
