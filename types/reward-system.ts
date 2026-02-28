// Ohm's Law Reward System Types — P = V × I

import type { CategorySlug, Difficulty } from "./question";

// ─── Voltage Tiers (V) ───────────────────────────────────────────────────────

export type VoltageTier = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface VoltageTierConfig {
  tier: VoltageTier;
  voltage: string;
  title: string;
  multiplier: number;
  requirements: {
    categoriesAtApprentice: number;
    categoriesAtJourneyman: number;
    categoriesAtMaster: number;
    totalQuestions: number;
    mockExams: number;
  };
  scaffolding: {
    showHints: boolean;
    showFormulas: boolean;
    showNecReferences: boolean;
    showArticleNumbers: boolean;
  };
}

export interface VoltageTierProgress {
  currentTier: VoltageTier;
  currentVoltage: string;
  currentTitle: string;
  nextTier: VoltageTierConfig | null;
  progress: {
    categoriesAtApprentice: { current: number; needed: number };
    categoriesAtJourneyman: { current: number; needed: number };
    categoriesAtMaster: { current: number; needed: number };
    totalQuestions: { current: number; needed: number };
    mockExams: { current: number; needed: number };
  };
  overallPercentage: number;
}

// ─── Amps (I) ────────────────────────────────────────────────────────────────

export interface AmpsState {
  streakAmps: number;
  volumeAmps: number;
  decayFactor: number;
  totalAmps: number;
}

export interface AmpsMultiplierBracket {
  min: number;
  max: number;
  multiplier: number;
}

// ─── Watts (W = V × I) ──────────────────────────────────────────────────────

export type WattsTransactionType =
  | "correct_answer"
  | "session_complete"
  | "daily_challenge"
  | "circuit_breaker_clear"
  | "streak_milestone"
  | "mock_exam_complete"
  | "power_up_purchase"
  | "breaker_reset"
  | "migration";

export interface WattsCalculation {
  baseReward: number;
  voltageMultiplier: number;
  ampsMultiplier: number;
  wattsEarned: number;
}

// ─── Spaced Repetition (SRS) ────────────────────────────────────────────────

export interface SRSState {
  questionId: string;
  userId: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
  lastReviewDate: Date | null;
  timesCorrect: number;
  timesWrong: number;
}

export type SRSQuality = 0 | 1 | 2 | 3 | 4 | 5;

export interface SRSUpdate {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
}

export interface SRSPriority {
  questionId: string;
  priority: number;
  overdueDays: number;
  categoryAmps: number;
  easeFactor: number;
}

// ─── Circuit Breaker ────────────────────────────────────────────────────────

export interface CircuitBreakerState {
  userId: string;
  categorySlug: CategorySlug;
  consecutiveWrong: number;
  isTripped: boolean;
  trippedAt: Date | null;
  cooldownEndsAt: Date | null;
  totalAttempts: number;
  totalTrips: number;
  currentStreak: number;
  bestStreak: number;
}

// ─── Friendships ────────────────────────────────────────────────────────────

export type FriendshipStatus = "pending" | "accepted" | "declined" | "blocked";

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Power-ups ──────────────────────────────────────────────────────────────

export type PowerUpType = "streak_fuse" | "formula_sheet" | "breaker_reset";

export interface PowerUpConfig {
  type: PowerUpType;
  name: string;
  description: string;
  cost: number;
  durationMinutes: number | null; // null = single use
  icon: string;
}

export interface PowerUpPurchase {
  id: string;
  userId: string;
  powerUpType: PowerUpType;
  purchasedAt: Date;
  expiresAt: Date | null;
  usedAt: Date | null;
  isActive: boolean;
}

// ─── Leaderboard ────────────────────────────────────────────────────────────

export type LeaderboardTier = "sub_panel" | "main_lug" | "service_entrance" | "transformer";

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  wattsLifetime: number;
  voltageTier: VoltageTier;
  currentAmps: number;
  leaderboardTier: LeaderboardTier;
  rank: number;
}

// ─── Power Grid ─────────────────────────────────────────────────────────────

export type PowerGridStatus = "energized" | "browned_out" | "de_energized" | "flickering";

export interface PowerGridCategory {
  categorySlug: CategorySlug;
  status: PowerGridStatus;
  accuracy: number;
  totalQuestions: number;
  srsHealth: number;
  lastWrongAt: Date | null;
  wasEnergized: boolean;
}

// ─── API Response Types ─────────────────────────────────────────────────────

export interface ProgressResponse {
  success: boolean;
  progressId: string;
  wattsEarned: number;
  wattsBalance: number;
  wattsLifetime: number;
  voltageTier: VoltageTier;
  currentAmps: number;
  levelUp: { newTier: VoltageTier; newTitle: string; newVoltage: string } | null;
  srsUpdated: boolean;
}

export interface SessionCompleteResponse {
  success: boolean;
  wattsEarned: number;
  wattsBalance: number;
  newStreak: number;
  currentAmps: number;
  voltageTier: VoltageTier;
}

export interface UserDataResponse {
  name: string;
  username: string | null;
  wattsBalance: number;
  wattsLifetime: number;
  voltageTier: VoltageTier;
  currentAmps: number;
  studyStreak: number;
  targetExamDate: string | null;
  hasSeenOnboarding: boolean;
  hasSeenTour: boolean;
  necYear: string;
}

export interface StatsResponse {
  totalAnswered: number;
  uniqueQuestionsAnswered: number;
  totalQuestionsInBank: number;
  correctCount: number;
  accuracy: number;
  answeredToday: number;
  categoryStats: Array<{
    slug: string;
    answered: number;
    correct: number;
    accuracy: number;
  }>;
  recentSessions: Array<{
    id: string;
    sessionType: string;
    categorySlug: string | null;
    questionsAnswered: number | null;
    questionsCorrect: number | null;
    startedAt: string | null;
    endedAt: string | null;
    wattsEarned: number;
  }>;
  wattsBalance: number;
  wattsLifetime: number;
  voltageTier: VoltageTier;
  currentAmps: number;
  studyStreak: number;
  bestStudyStreak: number;
  dailyChallengeCompleted: boolean;
  dailyChallengeWattsEarned: number;
  dailyChallengeWattsReward: number;
}
