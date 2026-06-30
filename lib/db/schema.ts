// Database Schema for SparkyPass
import { sqliteTable, text, integer, real, uniqueIndex, index } from "drizzle-orm/sqlite-core";

// Auth provider enum values
export const authProviderValues = ["google", "facebook", "apple", "email"] as const;
export type AuthProvider = (typeof authProviderValues)[number];

// Subscription source — discriminates which billing system minted the entitlement.
// 'trial' covers the initial 30-day window before any paid provider is on file.
export const subscriptionSourceValues = ["stripe", "apple", "trial"] as const;
export type SubscriptionSource = (typeof subscriptionSourceValues)[number];

// Linked-provider values mirror authProviderValues for now; kept separate so we
// can add OAuth-only providers (e.g., GitHub) here without forcing an authProvider expansion.
export const linkedProviderValues = ["google", "apple", "email"] as const;
export type LinkedProviderValue = (typeof linkedProviderValues)[number];

// Push platforms — iOS only for v1; android added when Section A-Q4 flips
export const pushPlatformValues = ["ios", "android"] as const;
export type PushPlatformValue = (typeof pushPlatformValues)[number];

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
  phone: text("phone"),
  dateOfBirth: integer("date_of_birth", { mode: "timestamp" }),
  targetExamDate: integer("target_exam_date", { mode: "timestamp" }),
  newsletterOptedIn: integer("newsletter_opted_in", { mode: "boolean" }).notNull().default(false),
  showHintsOnMaster: integer("show_hints_on_master", { mode: "boolean" }).notNull().default(false),
  questionsPerQuiz: integer("questions_per_quiz").notNull().default(0),
  focusMode: text("focus_mode"),  // null = off, "journeyman", "master"
  necYear: text("nec_year").notNull().default("2023"),
  hasSeenOnboarding: integer("has_seen_onboarding", { mode: "boolean" }).default(false),
  hasSeenTour: integer("has_seen_tour", { mode: "boolean" }).default(false),
  // Ohm's Law reward system fields
  xp: integer("xp").notNull().default(0),  // Repurposed: lifetime Watts
  coins: integer("coins").notNull().default(0),  // Deprecated: kept for migration, use wattsBalance
  level: integer("level").notNull().default(1),  // Repurposed: voltage tier (1-7)
  wattsBalance: integer("watts_balance").notNull().default(0),  // Spendable Watts
  wattsLifetime: integer("watts_lifetime").notNull().default(0),  // Total Watts ever earned
  ampsBase: real("amps_base").notNull().default(0),  // Current amps value
  ampsLastCalculated: integer("amps_last_calculated", { mode: "timestamp" }),
  streakFuseExpiresAt: integer("streak_fuse_expires_at", { mode: "timestamp" }),
  studyStreak: integer("study_streak").notNull().default(0),
  bestStudyStreak: integer("best_study_streak").notNull().default(0),
  lastStudyDate: integer("last_study_date", { mode: "timestamp" }),
  lastPenaltyDate: integer("last_penalty_date", { mode: "timestamp" }),
  // Porta Jon Challenge — break-time 3-question quiz gamification (migration 0023)
  throneStreak: integer("throne_streak").notNull().default(0),  // consecutive-day throne streak
  throneStreakBest: integer("throne_streak_best").notNull().default(0),  // all-time best
  throneLastCompletedAt: integer("throne_last_completed_at", { mode: "timestamp" }),  // drives 2h cooldown + streak date
  scrollsDodged: integer("scrolls_dodged").notNull().default(0),  // lifetime challenges completed (anti-doomscroll tally + title)
  portaJonLongestStreak: integer("porta_jon_longest_streak").notNull().default(0),  // all-time best consecutive-correct streak (endless run, migration 0024)
  // Subscription fields
  trialEndsAt: integer("trial_ends_at", { mode: "timestamp" }),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status"),  // trialing | active | past_due | canceled | expired
  subscriptionPeriodEnd: integer("subscription_period_end", { mode: "timestamp" }),
  betaAgreedAt: integer("beta_agreed_at", { mode: "timestamp" }),
  // Mobile foundation (migration 0019)
  deletedAt: integer("deleted_at", { mode: "timestamp" }),  // soft-delete; 30-day grace then hard delete
  timezone: text("timezone"),  // IANA name (e.g. "America/Denver"); set on first mobile sign-in
  subscriptionSource: text("subscription_source", { enum: subscriptionSourceValues }),  // billing provider
  appleOriginalTxId: text("apple_original_tx_id").unique(),  // RevenueCat-mirrored Apple originalTransactionId
  notificationPrefs: text("notification_prefs").notNull().default("{}"),  // JSON-encoded prefs blob
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

// Friendship status enum values
export const friendshipStatusValues = ["pending", "accepted", "declined", "blocked"] as const;
export type FriendshipStatusValue = (typeof friendshipStatusValues)[number];

// Power-up type enum values
export const powerUpTypeValues = ["streak_fuse", "formula_sheet", "breaker_reset", "sparky_tip"] as const;
export type PowerUpTypeValue = (typeof powerUpTypeValues)[number];

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
  wattsEarned: integer("watts_earned").notNull().default(0),
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

// ─── New Tables for Ohm's Law Reward System ─────────────────────────────────

// Question SRS (Spaced Repetition) state
export const questionSrs = sqliteTable("question_srs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  questionId: text("question_id").notNull(),
  easeFactor: real("ease_factor").notNull().default(2.5),
  interval: integer("interval").notNull().default(0),  // days
  repetitions: integer("repetitions").notNull().default(0),
  nextReviewDate: integer("next_review_date", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  lastReviewDate: integer("last_review_date", { mode: "timestamp" }),
  timesCorrect: integer("times_correct").notNull().default(0),
  timesWrong: integer("times_wrong").notNull().default(0),
});

export type QuestionSrs = typeof questionSrs.$inferSelect;
export type NewQuestionSrs = typeof questionSrs.$inferInsert;

// Circuit breaker state per category
export const circuitBreakerState = sqliteTable("circuit_breaker_state", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  categorySlug: text("category_slug").notNull(),
  consecutiveWrong: integer("consecutive_wrong").notNull().default(0),
  isTripped: integer("is_tripped", { mode: "boolean" }).notNull().default(false),
  trippedAt: integer("tripped_at", { mode: "timestamp" }),
  cooldownEndsAt: integer("cooldown_ends_at", { mode: "timestamp" }),
  totalAttempts: integer("total_attempts").notNull().default(0),
  totalTrips: integer("total_trips").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  bestStreak: integer("best_streak").notNull().default(0),
});

export type CircuitBreakerState = typeof circuitBreakerState.$inferSelect;
export type NewCircuitBreakerState = typeof circuitBreakerState.$inferInsert;

// Friendships
export const friendships = sqliteTable("friendships", {
  id: text("id").primaryKey(),
  requesterId: text("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  addresseeId: text("addressee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status", { enum: friendshipStatusValues }).notNull().default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type Friendship = typeof friendships.$inferSelect;
export type NewFriendship = typeof friendships.$inferInsert;

// Power-up purchases
export const powerUpPurchases = sqliteTable("power_up_purchases", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  powerUpType: text("power_up_type", { enum: powerUpTypeValues }).notNull(),
  purchasedAt: integer("purchased_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  usedAt: integer("used_at", { mode: "timestamp" }),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(false),
});

export type PowerUpPurchase = typeof powerUpPurchases.$inferSelect;
export type NewPowerUpPurchase = typeof powerUpPurchases.$inferInsert;

// Game pack purchases
export const gameIdValues = ["index-sniper", "translation-engine", "formula-builder"] as const;
export type GameIdValue = (typeof gameIdValues)[number];

export const gamePackPurchases = sqliteTable("game_pack_purchases", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  gameId: text("game_id", { enum: gameIdValues }).notNull(),
  packId: text("pack_id").notNull(),
  cost: integer("cost").notNull(),
  purchasedAt: integer("purchased_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type GamePackPurchase = typeof gamePackPurchases.$inferSelect;
export type NewGamePackPurchase = typeof gamePackPurchases.$inferInsert;

// Game mastery state (mastery-based pack unlocking)
export const gameMasteryState = sqliteTable("game_mastery_state", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  gameId: text("game_id", { enum: gameIdValues }).notNull(),
  unlockedPackIndex: integer("unlocked_pack_index").notNull().default(0),
  bestStreak: integer("best_streak").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type GameMasteryState = typeof gameMasteryState.$inferSelect;
export type NewGameMasteryState = typeof gameMasteryState.$inferInsert;

// Watts transactions (audit log)
export const wattsTransactions = sqliteTable("watts_transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),  // WattsTransactionType
  amount: integer("amount").notNull(),  // positive = earned, negative = spent
  balanceAfter: integer("balance_after").notNull(),
  voltageAtTime: integer("voltage_at_time").notNull(),  // tier at time of transaction
  ampsAtTime: real("amps_at_time").notNull(),  // amps at time of transaction
  description: text("description"),
  sourceSessionId: text("source_session_id"),  // idempotency key for session awards (migration 0022); partial-unique on (user_id, source_session_id)
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type WattsTransaction = typeof wattsTransactions.$inferSelect;
export type NewWattsTransaction = typeof wattsTransactions.$inferInsert;

// Beta analytics events (first-party, privacy-friendly)
export const analyticsEvents = sqliteTable("analytics_events", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  event: text("event").notNull(),  // page_view, feature_use, session_start, session_end, feedback_prompt, drop_off
  page: text("page"),
  metadata: text("metadata"),  // JSON string for extra context (e.g. quiz category, button clicked)
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert;

// Referral tracking
export const referrals = sqliteTable("referrals", {
  id: text("id").primaryKey(),
  referrerId: text("referrer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  referredUserId: text("referred_user_id").references(() => users.id, { onDelete: "set null" }),
  code: text("code").notNull().unique(),
  status: text("status").notNull().default("pending"),  // pending | completed
  wattsAwarded: integer("watts_awarded").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;

// ─── Mobile foundation (migration 0019) ─────────────────────────────────────

// Refresh tokens for mobile auth. Strict rotation per plan §D-18 and audit OQ#2:
// every refresh issues a new tokenHash and sets rotatedToHash + rotatedAt on the
// old row. Old token is accepted for a 30s grace window after rotation; any use
// past that window revokes the whole device session (theft signal).
export const refreshTokens = sqliteTable(
  "refresh_tokens",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    deviceId: text("device_id").notNull(),  // client-generated UUID, stable per install
    tokenHash: text("token_hash").notNull().unique(),  // SHA-256 of the refresh token
    rotatedToHash: text("rotated_to_hash"),  // hash of the successor token after rotation
    rotatedAt: integer("rotated_at", { mode: "timestamp" }),  // when rotation happened
    revokedAt: integer("revoked_at", { mode: "timestamp" }),  // theft signal or explicit logout
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),  // 90-day sliding TTL
    lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
  },
  (table) => ({
    userDeviceIdx: index("refresh_tokens_user_device_idx").on(table.userId, table.deviceId),
  }),
);

export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;

// Expo push tokens. One row per (user, device). Unregistered on logout, on token
// rotation (Expo can re-issue), or on receipt of a 410 from Expo's send API.
export const pushTokens = sqliteTable(
  "push_tokens",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),  // ExponentPushToken[xxx] string
    deviceId: text("device_id").notNull(),  // matches refresh_tokens.device_id
    platform: text("platform", { enum: pushPlatformValues }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
  },
  (table) => ({
    userIdx: index("push_tokens_user_idx").on(table.userId),
  }),
);

export type PushToken = typeof pushTokens.$inferSelect;
export type NewPushToken = typeof pushTokens.$inferInsert;

// Linked OAuth providers. A user can have at most one entry per (provider, providerSubject)
// pair; the subject is the OAuth subject claim (sub) for Google, the Apple user identifier
// for SiwA, or null/email for the email provider.
export const linkedProviders = sqliteTable(
  "linked_providers",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider", { enum: linkedProviderValues }).notNull(),
    providerSubject: text("provider_subject").notNull(),
    linkedAt: integer("linked_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => ({
    providerSubjectIdx: uniqueIndex("linked_providers_provider_subject_idx").on(
      table.provider,
      table.providerSubject,
    ),
    userIdx: index("linked_providers_user_idx").on(table.userId),
  }),
);

export type LinkedProvider = typeof linkedProviders.$inferSelect;
export type NewLinkedProvider = typeof linkedProviders.$inferInsert;

// Sync event log for offline-first idempotency (audit Section 3 Sync).
// Client sends (deviceId, batchId, clientId) on every uploaded event; server inserts
// here before processing and rejects duplicate (deviceId, batchId, clientId) triples.
// TTL: ~30 days, cleaned by a cron job.
export const syncEventLog = sqliteTable(
  "sync_event_log",
  {
    id: text("id").primaryKey(),
    deviceId: text("device_id").notNull(),
    batchId: text("batch_id").notNull(),
    clientId: text("client_id").notNull(),  // per-event UUID generated on device
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    processedAt: integer("processed_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => ({
    idempotencyIdx: uniqueIndex("sync_event_log_idempotency_idx").on(
      table.deviceId,
      table.batchId,
      table.clientId,
    ),
    processedAtIdx: index("sync_event_log_processed_at_idx").on(table.processedAt),  // for TTL sweep
  }),
);

export type SyncEventLog = typeof syncEventLog.$inferSelect;
export type NewSyncEventLog = typeof syncEventLog.$inferInsert;

// Pre-auth account-linking codes for the Hide-My-Email flow (audit OQ#5).
// When a SiwA user signs up with Apple's relay address and we detect a pre-existing
// account under their real email, we send a 6-digit code to that email via /api/auth/mobile/link-request,
// then consume it via /api/auth/mobile/link-confirm to link the new provider. 10-min TTL.
export const linkCodes = sqliteTable(
  "link_codes",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    provider: text("provider", { enum: linkedProviderValues }).notNull(),
    providerSubject: text("provider_subject").notNull(),
    codeHash: text("code_hash").notNull(),  // SHA-256 of the 6-digit code
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    consumedAt: integer("consumed_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => ({
    emailIdx: index("link_codes_email_idx").on(table.email),
    expiresAtIdx: index("link_codes_expires_at_idx").on(table.expiresAt),
  }),
);

export type LinkCode = typeof linkCodes.$inferSelect;
export type NewLinkCode = typeof linkCodes.$inferInsert;

// ─── Feedback (migration 0020) — OQ#9 anti-spam ────────────────────────────
//
// Per audit OQ#9 resolution: keep awarding Watts for feedback at public launch
// BUT gate the payout on moderation approval to prevent spam farming.
// Implementation:
//   1. Insert here on submission (pending status)
//   2. Email also sent (kept for inbox notification)
//   3. Admin moderation page approves → set rewardedAt + insert Watts transaction
//   4. Rate limit: 1 reward-eligible submission per user per 24h (enforced in route)

export const feedbackTypeValues = ["bug", "improvement", "confusing"] as const;
export type FeedbackTypeValue = (typeof feedbackTypeValues)[number];

export const feedbackModerationValues = ["pending", "approved", "rejected"] as const;
export type FeedbackModerationValue = (typeof feedbackModerationValues)[number];

export const feedback = sqliteTable(
  "feedback",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type", { enum: feedbackTypeValues }).notNull(),
    message: text("message").notNull(),
    page: text("page"),
    moderationStatus: text("moderation_status", { enum: feedbackModerationValues })
      .notNull()
      .default("pending"),
    rewardedAt: integer("rewarded_at", { mode: "timestamp" }),  // null until Watts awarded
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => ({
    userIdx: index("feedback_user_idx").on(table.userId),
    moderationIdx: index("feedback_moderation_idx").on(table.moderationStatus),
    createdAtIdx: index("feedback_created_at_idx").on(table.createdAt),
  }),
);

export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;
