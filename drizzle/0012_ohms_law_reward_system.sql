-- Migration: Ohm's Law Reward System (P = V × I)
-- Replaces coins/XP/levels with Watts/Voltage/Amps

-- ─── Add new columns to users table ────────────────────────────────────────

ALTER TABLE users ADD COLUMN phone TEXT;
ALTER TABLE users ADD COLUMN watts_balance INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN watts_lifetime INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN amps_base REAL NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN amps_last_calculated INTEGER;
ALTER TABLE users ADD COLUMN streak_fuse_expires_at INTEGER;

-- ─── Add watts_earned to study_sessions ────────────────────────────────────

ALTER TABLE study_sessions ADD COLUMN watts_earned INTEGER NOT NULL DEFAULT 0;

-- ─── Migrate existing data ─────────────────────────────────────────────────

-- Convert xp + coins*2 → watts_balance and watts_lifetime
UPDATE users SET
  watts_balance = xp + (coins * 2),
  watts_lifetime = xp + (coins * 2);

-- Map old levels (1-10) → voltage tiers (1-5)
-- Level 1-2 → Tier 1, Level 3-4 → Tier 2, Level 5-6 → Tier 3, Level 7 → Tier 4, Level 8-10 → Tier 5
UPDATE users SET level = CASE
  WHEN level <= 2 THEN 1
  WHEN level <= 4 THEN 2
  WHEN level <= 6 THEN 3
  WHEN level <= 7 THEN 4
  ELSE 5
END;

-- ─── Create new tables ─────────────────────────────────────────────────────

-- Question SRS (Spaced Repetition System)
CREATE TABLE IF NOT EXISTS question_srs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  ease_factor REAL NOT NULL DEFAULT 2.5,
  interval INTEGER NOT NULL DEFAULT 0,
  repetitions INTEGER NOT NULL DEFAULT 0,
  next_review_date INTEGER NOT NULL,
  last_review_date INTEGER,
  times_correct INTEGER NOT NULL DEFAULT 0,
  times_wrong INTEGER NOT NULL DEFAULT 0
);

-- Circuit breaker state (per category)
CREATE TABLE IF NOT EXISTS circuit_breaker_state (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_slug TEXT NOT NULL,
  consecutive_wrong INTEGER NOT NULL DEFAULT 0,
  is_tripped INTEGER NOT NULL DEFAULT 0,
  tripped_at INTEGER,
  cooldown_ends_at INTEGER,
  total_attempts INTEGER NOT NULL DEFAULT 0,
  total_trips INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0
);

-- Friendships
CREATE TABLE IF NOT EXISTS friendships (
  id TEXT PRIMARY KEY,
  requester_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Power-up purchases
CREATE TABLE IF NOT EXISTS power_up_purchases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  power_up_type TEXT NOT NULL,
  purchased_at INTEGER NOT NULL,
  expires_at INTEGER,
  used_at INTEGER,
  is_active INTEGER NOT NULL DEFAULT 0
);

-- Watts transactions (audit log)
CREATE TABLE IF NOT EXISTS watts_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  voltage_at_time INTEGER NOT NULL,
  amps_at_time REAL NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL
);
