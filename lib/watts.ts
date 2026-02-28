// Watts (W = V × I) — Currency system
// Watts are earned on actions and spent on power-ups

import type { Difficulty } from "@/types/question";
import type { VoltageTier, WattsTransactionType, WattsCalculation, PowerUpType } from "@/types/reward-system";
import { getVoltageMultiplier } from "./voltage";
import { getAmpsMultiplier } from "./amps";

// ─── Base Rewards ────────────────────────────────────────────────────────────

export const BASE_REWARDS: Record<string, Record<string, number>> = {
  correct_answer: {
    apprentice: 10,
    journeyman: 20,
    master: 35,
  },
  session_complete: {
    apprentice: 25,
    journeyman: 40,
    master: 65,
  },
  daily_challenge: { default: 30 },
  circuit_breaker_clear: { default: 50 },
  mock_exam_complete: { default: 100 },
};

// Streak milestone rewards
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
 * Calculate Watts earned for an action.
 * watts_earned = base_reward × voltage_multiplier × amps_multiplier
 */
export function calculateWattsEarned(params: {
  type: WattsTransactionType;
  difficulty?: Difficulty | string | null;
  voltageTier: VoltageTier;
  currentAmps: number;
}): WattsCalculation {
  const { type, difficulty, voltageTier, currentAmps } = params;

  // Determine base reward
  let baseReward = 0;
  const typeRewards = BASE_REWARDS[type];
  if (typeRewards) {
    if (difficulty && typeRewards[difficulty]) {
      baseReward = typeRewards[difficulty];
    } else if (typeRewards.default !== undefined) {
      baseReward = typeRewards.default;
    } else {
      // Fallback to journeyman
      baseReward = typeRewards.journeyman || 0;
    }
  }

  const voltageMultiplier = getVoltageMultiplier(voltageTier);
  const ampsMultiplier = getAmpsMultiplier(currentAmps);
  const wattsEarned = Math.round(baseReward * voltageMultiplier * ampsMultiplier);

  return {
    baseReward,
    voltageMultiplier,
    ampsMultiplier,
    wattsEarned,
  };
}

/**
 * Calculate Watts earned for a correct answer.
 */
export function calculateAnswerWatts(
  difficulty: Difficulty | string | null | undefined,
  voltageTier: VoltageTier,
  currentAmps: number
): number {
  return calculateWattsEarned({
    type: "correct_answer",
    difficulty,
    voltageTier,
    currentAmps,
  }).wattsEarned;
}

/**
 * Calculate Watts earned for completing a session.
 */
export function calculateSessionWatts(
  difficulty: Difficulty | string | null | undefined,
  voltageTier: VoltageTier,
  currentAmps: number
): number {
  return calculateWattsEarned({
    type: "session_complete",
    difficulty,
    voltageTier,
    currentAmps,
  }).wattsEarned;
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

/**
 * Convert old XP + coins to Watts for migration.
 * watts = xp + (coins × 2)
 */
export function migrateToWatts(xp: number, coins: number): number {
  return xp + coins * 2;
}
