// Database Schema for SparkyPass
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Auth provider enum values
export const authProviderValues = ["google", "facebook", "apple", "email"] as const;
export type AuthProvider = (typeof authProviderValues)[number];

// Users table
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  authProvider: text("auth_provider", { enum: authProviderValues }).notNull().default("email"),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  username: text("username").unique(),
  city: text("city"),
  state: text("state"),
  dateOfBirth: integer("date_of_birth", { mode: "timestamp" }),
  targetExamDate: integer("target_exam_date", { mode: "timestamp" }),
  newsletterOptedIn: integer("newsletter_opted_in", { mode: "boolean" }).notNull().default(false),
  showHintsOnMaster: integer("show_hints_on_master", { mode: "boolean" }).notNull().default(false),
  questionsPerQuiz: integer("questions_per_quiz").notNull().default(0),
  focusMode: text("focus_mode"),  // null = off, "journeyman", "master"
  necYear: text("nec_year").notNull().default("2023"),
  hasSeenOnboarding: integer("has_seen_onboarding", { mode: "boolean" }).default(false),
  hasSeenTour: integer("has_seen_tour", { mode: "boolean" }).default(false),
  xp: integer("xp").notNull().default(0),
  coins: integer("coins").notNull().default(0),
  level: integer("level").notNull().default(1),
  studyStreak: integer("study_streak").notNull().default(0),
  bestStudyStreak: integer("best_study_streak").notNull().default(0),
  lastStudyDate: integer("last_study_date", { mode: "timestamp" }),
  // Subscription fields
  trialEndsAt: integer("trial_ends_at", { mode: "timestamp" }),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status"),  // trialing | active | past_due | canceled | expired
  subscriptionPeriodEnd: integer("subscription_period_end", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Type inference for User from schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Verification tokens table for email verification
export const verificationTokens = sqliteTable("verification_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Type inference for VerificationToken from schema
export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;

// Password reset tokens table
export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Type inference for PasswordResetToken from schema
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;

// Session type enum values
export const sessionTypeValues = ["quiz", "flashcard", "mock_exam", "daily_challenge", "load_calculator"] as const;
export type SessionType = (typeof sessionTypeValues)[number];

// User progress table - tracks individual question attempts
export const userProgress = sqliteTable("user_progress", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  questionId: text("question_id").notNull(),
  isCorrect: integer("is_correct", { mode: "boolean" }).notNull(),
  timeSpentSeconds: integer("time_spent_seconds"),
  answeredAt: integer("answered_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Type inference for UserProgress from schema
export type UserProgress = typeof userProgress.$inferSelect;
export type NewUserProgress = typeof userProgress.$inferInsert;

// Study sessions table - tracks study session summaries
export const studySessions = sqliteTable("study_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  startedAt: integer("started_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  endedAt: integer("ended_at", { mode: "timestamp" }),
  sessionType: text("session_type", { enum: sessionTypeValues }).notNull(),
  categorySlug: text("category_slug"),
  questionsAnswered: integer("questions_answered"),
  questionsCorrect: integer("questions_correct"),
  xpEarned: integer("xp_earned").notNull().default(0),
});

// Type inference for StudySession from schema
export type StudySession = typeof studySessions.$inferSelect;
export type NewStudySession = typeof studySessions.$inferInsert;

// Bookmarks table - tracks saved questions for review
export const bookmarks = sqliteTable("bookmarks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  questionId: text("question_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Type inference for Bookmark from schema
export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;

// Flashcard bookmarks table - tracks saved flashcards for review
export const flashcardBookmarks = sqliteTable("flashcard_bookmarks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  flashcardId: text("flashcard_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Type inference for FlashcardBookmark from schema
export type FlashcardBookmark = typeof flashcardBookmarks.$inferSelect;
export type NewFlashcardBookmark = typeof flashcardBookmarks.$inferInsert;

// Quiz results table - tracks completed quiz scores by category
export const quizResults = sqliteTable("quiz_results", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  categorySlug: text("category_slug").notNull(),
  difficulty: text("difficulty"),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  bestStreak: integer("best_streak").notNull().default(0),
  completedAt: integer("completed_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Type inference for QuizResult from schema
export type QuizResult = typeof quizResults.$inferSelect;
export type NewQuizResult = typeof quizResults.$inferInsert;
