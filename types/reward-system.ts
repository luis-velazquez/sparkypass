// Resistance & Reward System Types — P = V × I

import type { CategorySlug, Difficulty } from "./question";

// ─── Quiz Voltage ───────────────────────────────────────────────────────────

export type QuizVoltage = 120 | 208 | 277 | 480;

// ─── User Classification (replaces 7-tier system) ──────────────────────────

export type UserClassification =
  | "watt_apprentice"
  | "kilowatt_electrician"
  | "megawatt_electrician"
  | "gigawatt_electrician";

// ─── Quiz Watts Result ─────────────────────────────────────────────────────

export interface QuizWattsResult {
  totalCorrect: number;
  totalQuestions: number;
  passed: boolean;
  rawWatts: number;
  finalWatts: number;
  bestStreak: number;
  answerVoltages: number[];
}

// ─── Watts Transaction Types ───────────────────────────────────────────────

export type WattsTransactionType =
  // New system
  | "quiz_complete"
  | "daily_challenge"
  | "review_complete"
  | "circuit_breaker_clear"
  | "index_game"
  | "streak_milestone"
  | "resistance_no_login"
  | "resistance_missed_review"
  | "power_up_purchase"
  | "game_pack_purchase"
  | "game_continue"
  | "game_hint"
  // Legacy (kept for old DB rows)
  | "correct_answer"
  | "session_complete"
  | "mock_exam_complete"
  | "breaker_reset"
  | "migration";

// ─── Scaffolding ───────────────────────────────────────────────────────────

export interface Scaffolding {
  showHints: boolean;
  showFormulas: boolean;
  showNecReferences: boolean;
  showArticleNumbers: boolean;
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
  classification: UserClassification;
  classificationTitle: string;
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
  srsUpdated: boolean;
  breakerTripped: boolean;
  breakerJustTripped: boolean;
}

export interface SessionCompleteResponse {
  success: boolean;
  wattsEarned: number;
  wattsBalance: number;
  newStreak: number;
  classification: UserClassification;
  classificationTitle: string;
}

export interface UserDataResponse {
  name: string;
  username: string | null;
  wattsBalance: number;
  wattsLifetime: number;
  classification: UserClassification;
  classificationTitle: string;
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
  classification: UserClassification;
  classificationTitle: string;
  studyStreak: number;
  bestStudyStreak: number;
  dailyChallengeCompleted: boolean;
  dailyChallengeWattsEarned: number;
  dailyChallengeWattsReward: number;
}
