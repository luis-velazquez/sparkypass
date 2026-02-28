// Reward system for SparkyPass — Ohm's Law: P = V × I
// Watts replace XP+coins. Voltage tiers replace levels.

import type { Difficulty } from "@/types/question";
import type { VoltageTier } from "@/types/reward-system";
import { VOLTAGE_TIERS, getVoltageTierConfig, calculateVoltageTier, checkVoltageAdvancement, getVoltageTierProgress } from "./voltage";
import { calculateAmps, getDaysIdle, getAmpsMultiplier } from "./amps";
import { calculateAnswerWatts, calculateSessionWatts, STREAK_WATTS_MILESTONES } from "./watts";

// ─── Re-exports for backward compatibility ──────────────────────────────────

export {
  VOLTAGE_TIERS,
  getVoltageTierConfig,
  calculateVoltageTier,
  checkVoltageAdvancement,
  getVoltageTierProgress,
} from "./voltage";

export {
  calculateAmps,
  getDaysIdle,
  getAmpsMultiplier,
  getAmpsLabel,
} from "./amps";

export {
  calculateAnswerWatts,
  calculateSessionWatts,
  calculateWattsEarned,
  STREAK_WATTS_MILESTONES,
  POWER_UP_COSTS,
  migrateToWatts,
} from "./watts";

// ─── Difficulty-scaled Watts rewards (replaces XP_REWARDS + COIN_REWARDS) ──

export const DIFFICULTY_WATTS_REWARDS: Record<Difficulty, { CORRECT_ANSWER: number; SESSION_COMPLETE: number }> = {
  apprentice: { CORRECT_ANSWER: 10, SESSION_COMPLETE: 25 },
  journeyman: { CORRECT_ANSWER: 20, SESSION_COMPLETE: 40 },
  master: { CORRECT_ANSWER: 35, SESSION_COMPLETE: 65 },
};

export function getWattsRewardsForDifficulty(difficulty?: Difficulty | string | null): { CORRECT_ANSWER: number; SESSION_COMPLETE: number } {
  if (difficulty && difficulty in DIFFICULTY_WATTS_REWARDS) {
    return DIFFICULTY_WATTS_REWARDS[difficulty as Difficulty];
  }
  return DIFFICULTY_WATTS_REWARDS.journeyman;
}

// Backward-compatible alias
export const WATTS_REWARDS = DIFFICULTY_WATTS_REWARDS.journeyman;

// ─── Streak Watts bonuses (replaces STREAK_COIN_BONUSES) ────────────────────

export const STREAK_BONUSES = STREAK_WATTS_MILESTONES;

// ─── Voltage tier functions (replace LEVEL_THRESHOLDS + level functions) ────

export function getTierTitle(tier: VoltageTier | number): string {
  const config = VOLTAGE_TIERS[(tier as number) - 1];
  return config?.title || "Low Voltage Trainee";
}

export function getTierVoltage(tier: VoltageTier | number): string {
  const config = VOLTAGE_TIERS[(tier as number) - 1];
  return config?.voltage || "12V";
}

/**
 * Check if a voltage tier advancement occurred.
 * Returns the new tier info if advancement happened, or null if not.
 */
export function checkTierUp(
  previousTier: number,
  newTier: number
): { newTier: number; newTitle: string; newVoltage: string } | null {
  if (newTier > previousTier) {
    const config = VOLTAGE_TIERS[newTier - 1];
    if (config) {
      return { newTier, newTitle: config.title, newVoltage: config.voltage };
    }
  }
  return null;
}

// ─── Backward-compatible aliases ────────────────────────────────────────────
// These map old function names to new ones so existing code doesn't break
// during the transition period.

/** @deprecated Use getTierTitle instead */
export function getLevelTitle(level: number): string {
  return getTierTitle(level as VoltageTier);
}

/** @deprecated Use voltage tier progress instead */
export function getXPProgress(xp: number, level: number): { current: number; needed: number; percentage: number } {
  // For backward compat during migration, return watts-based progress
  // This is a simplified version — real progress is based on tier requirements
  return { current: xp, needed: xp || 1, percentage: 100 };
}

/** @deprecated Use checkTierUp instead */
export function checkLevelUp(
  previousXP: number,
  newXP: number
): { newLevel: number; newTitle: string } | null {
  // Deprecated — tier advancement is now based on content mastery, not XP
  return null;
}

/** @deprecated Use getLevelFromXP — only kept for migration */
export function getLevelFromXP(xp: number): number {
  return 1; // No longer meaningful
}
