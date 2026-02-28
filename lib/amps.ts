// Amps (I) — Decaying activity metric
// Drops when you stop studying, reflects recent engagement

import type { AmpsState, AmpsMultiplierBracket } from "@/types/reward-system";

// Constants
const MAX_STREAK_AMPS = 40;
const STREAK_AMPS_PER_DAY = 2;
const MAX_VOLUME_AMPS = 60;
const VOLUME_AMPS_PER_QUESTION = 0.5;
const DECAY_RATE = 0.15;
const DECAY_FLOOR = 0.1;
const MAX_AMPS = 100;

// Amps multiplier brackets
export const AMPS_MULTIPLIER_BRACKETS: AmpsMultiplierBracket[] = [
  { min: 0, max: 10, multiplier: 0.5 },
  { min: 10, max: 30, multiplier: 1.0 },
  { min: 30, max: 50, multiplier: 1.5 },
  { min: 50, max: 70, multiplier: 2.0 },
  { min: 70, max: 100, multiplier: 2.5 },
];

/**
 * Calculate streak-based amps.
 * Cap at 40A from a 20-day streak.
 */
export function calculateStreakAmps(streakDays: number): number {
  return Math.min(streakDays * STREAK_AMPS_PER_DAY, MAX_STREAK_AMPS);
}

/**
 * Calculate volume-based amps from questions answered in last 7 days.
 * Cap at 60A from volume.
 */
export function calculateVolumeAmps(questionsLast7Days: number): number {
  return Math.min(questionsLast7Days * VOLUME_AMPS_PER_QUESTION, MAX_VOLUME_AMPS);
}

/**
 * Calculate exponential decay factor based on days since last study.
 * Returns a value between DECAY_FLOOR (0.1) and 1.0.
 */
export function calculateDecayFactor(daysIdle: number): number {
  if (daysIdle <= 0) return 1;
  return Math.max(DECAY_FLOOR, Math.exp(-DECAY_RATE * daysIdle));
}

/**
 * Calculate total amps from all components.
 * I = (I_streak + I_volume) × decay_factor
 */
export function calculateAmps(params: {
  streakDays: number;
  questionsLast7Days: number;
  daysIdle: number;
}): AmpsState {
  const streakAmps = calculateStreakAmps(params.streakDays);
  const volumeAmps = calculateVolumeAmps(params.questionsLast7Days);
  const decayFactor = calculateDecayFactor(params.daysIdle);
  const totalAmps = Math.min(Math.round((streakAmps + volumeAmps) * decayFactor * 10) / 10, MAX_AMPS);

  return {
    streakAmps,
    volumeAmps,
    decayFactor: Math.round(decayFactor * 100) / 100,
    totalAmps,
  };
}

/**
 * Get the amps multiplier for a given amps value.
 */
export function getAmpsMultiplier(amps: number): number {
  for (const bracket of AMPS_MULTIPLIER_BRACKETS) {
    if (amps >= bracket.min && amps < bracket.max) {
      return bracket.multiplier;
    }
  }
  // 100A exactly
  return AMPS_MULTIPLIER_BRACKETS[AMPS_MULTIPLIER_BRACKETS.length - 1].multiplier;
}

/**
 * Calculate days idle from last study date.
 */
export function getDaysIdle(lastStudyDate: Date | null): number {
  if (!lastStudyDate) return 30; // No record → assume 30 days idle
  const now = new Date();
  const diffMs = now.getTime() - lastStudyDate.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Get a human-readable label for the current amps level.
 */
export function getAmpsLabel(amps: number): string {
  if (amps >= 70) return "Surging";
  if (amps >= 50) return "High Current";
  if (amps >= 30) return "Steady Flow";
  if (amps >= 10) return "Low Current";
  return "Trickle";
}
