// Level system configuration for SparkyPass
// XP thresholds from SP-020: 1:0, 2:500, 3:1000, 4:2000, 5:3500, 6:5500, 7:8000, 8:11000, 9:15000, 10:20000

import type { Difficulty } from "@/types/question";

// Difficulty-scaled XP rewards
export const DIFFICULTY_XP_REWARDS: Record<Difficulty, { CORRECT_ANSWER: number; QUIZ_COMPLETE: number }> = {
  apprentice: { CORRECT_ANSWER: 15, QUIZ_COMPLETE: 30 },
  journeyman: { CORRECT_ANSWER: 25, QUIZ_COMPLETE: 50 },
  master: { CORRECT_ANSWER: 40, QUIZ_COMPLETE: 75 },
};

/** Get XP rewards for a difficulty level. Falls back to journeyman. */
export function getXPRewardsForDifficulty(difficulty?: Difficulty | string | null): { CORRECT_ANSWER: number; QUIZ_COMPLETE: number } {
  if (difficulty && difficulty in DIFFICULTY_XP_REWARDS) {
    return DIFFICULTY_XP_REWARDS[difficulty as Difficulty];
  }
  return DIFFICULTY_XP_REWARDS.journeyman;
}

// Backward-compatible alias (journeyman baseline) for daily/bookmarks
export const XP_REWARDS = DIFFICULTY_XP_REWARDS.journeyman;

// Difficulty-scaled coin rewards
export const DIFFICULTY_COIN_REWARDS: Record<Difficulty, { CORRECT_ANSWER: number; QUIZ_COMPLETE: number }> = {
  apprentice: { CORRECT_ANSWER: 5, QUIZ_COMPLETE: 10 },
  journeyman: { CORRECT_ANSWER: 10, QUIZ_COMPLETE: 20 },
  master: { CORRECT_ANSWER: 20, QUIZ_COMPLETE: 40 },
};

/** Get coin rewards for a difficulty level. Falls back to journeyman. */
export function getCoinRewardsForDifficulty(difficulty?: Difficulty | string | null): { CORRECT_ANSWER: number; QUIZ_COMPLETE: number } {
  if (difficulty && difficulty in DIFFICULTY_COIN_REWARDS) {
    return DIFFICULTY_COIN_REWARDS[difficulty as Difficulty];
  }
  return DIFFICULTY_COIN_REWARDS.journeyman;
}

// Backward-compatible alias (journeyman baseline) for daily/bookmarks
export const COIN_REWARDS = DIFFICULTY_COIN_REWARDS.journeyman;

// Streak milestone coin bonuses
export const STREAK_COIN_BONUSES: Record<number, number> = {
  5: 25,
  10: 50,
  15: 100,
  20: 200,
};

export const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, title: "Apprentice" },
  { level: 2, xp: 500, title: "Wire Puller" },
  { level: 3, xp: 1000, title: "Circuit Rookie" },
  { level: 4, xp: 2000, title: "Voltage Learner" },
  { level: 5, xp: 3500, title: "Current Carrier" },
  { level: 6, xp: 5500, title: "Panel Pro" },
  { level: 7, xp: 8000, title: "Load Calculator" },
  { level: 8, xp: 11000, title: "Code Scholar" },
  { level: 9, xp: 15000, title: "Master Candidate" },
  { level: 10, xp: 20000, title: "Master Electrician" },
] as const;

export function getLevelFromXP(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i].xp) {
      return LEVEL_THRESHOLDS[i].level;
    }
  }
  return 1;
}

export function getLevelTitle(level: number): string {
  const levelData = LEVEL_THRESHOLDS.find((l) => l.level === level);
  return levelData?.title || "Apprentice";
}

export function getXPForLevel(level: number): number {
  const levelData = LEVEL_THRESHOLDS.find((l) => l.level === level);
  return levelData?.xp || 0;
}

export function getXPForNextLevel(currentLevel: number): number {
  const nextLevel = LEVEL_THRESHOLDS.find((l) => l.level === currentLevel + 1);
  return nextLevel?.xp || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1].xp;
}

export function getXPProgress(xp: number, level: number): { current: number; needed: number; percentage: number } {
  const currentLevelXP = getXPForLevel(level);
  const nextLevelXP = getXPForNextLevel(level);

  const xpIntoCurrentLevel = xp - currentLevelXP;
  const xpNeededForNextLevel = nextLevelXP - currentLevelXP;

  // If at max level, show full bar
  if (level >= 10) {
    return { current: xp, needed: xp, percentage: 100 };
  }

  const percentage = Math.min(100, Math.round((xpIntoCurrentLevel / xpNeededForNextLevel) * 100));

  return {
    current: xpIntoCurrentLevel,
    needed: xpNeededForNextLevel,
    percentage,
  };
}

/**
 * Checks if a level-up occurred when XP increased.
 * Returns the new level info if a level-up happened, or null if not.
 */
export function checkLevelUp(
  previousXP: number,
  newXP: number
): { newLevel: number; newTitle: string } | null {
  const previousLevel = getLevelFromXP(previousXP);
  const newLevel = getLevelFromXP(newXP);

  if (newLevel > previousLevel) {
    return {
      newLevel,
      newTitle: getLevelTitle(newLevel),
    };
  }

  return null;
}

/**
 * Calculates XP earned from a quiz session based on correct answers.
 * Accepts an optional difficulty to use scaled XP rewards.
 */
export function calculateQuizXP(correctAnswers: number, difficulty?: Difficulty | string | null): {
  answerXP: number;
  bonusXP: number;
  totalXP: number;
} {
  const rewards = getXPRewardsForDifficulty(difficulty);
  const answerXP = correctAnswers * rewards.CORRECT_ANSWER;
  const bonusXP = rewards.QUIZ_COMPLETE;
  return {
    answerXP,
    bonusXP,
    totalXP: answerXP + bonusXP,
  };
}

/**
 * Calculates coins earned from a quiz session based on correct answers.
 * Accepts an optional difficulty to use scaled coin rewards.
 */
export function calculateQuizCoins(correctAnswers: number, difficulty?: Difficulty | string | null): {
  answerCoins: number;
  bonusCoins: number;
  totalCoins: number;
} {
  const rewards = getCoinRewardsForDifficulty(difficulty);
  const answerCoins = correctAnswers * rewards.CORRECT_ANSWER;
  const bonusCoins = rewards.QUIZ_COMPLETE;
  return {
    answerCoins,
    bonusCoins,
    totalCoins: answerCoins + bonusCoins,
  };
}
