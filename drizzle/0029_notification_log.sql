-- Sparky notifications: one row per push Sparky sends to a user.
-- Used for frequency caps, per-type cooldowns, one-time milestone keys and
-- template rotation (lib/sparky-notify). The unique (user_id, dedup_key) index
-- stops overlapping cron runs from sending the same message twice.
-- opened_at is reserved for tap tracking.
CREATE TABLE IF NOT EXISTS notification_log (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  dedup_key TEXT,
  variant INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at INTEGER NOT NULL,
  opened_at INTEGER
);
CREATE INDEX IF NOT EXISTS notification_log_user_sent_idx ON notification_log (user_id, sent_at);
CREATE UNIQUE INDEX IF NOT EXISTS notification_log_user_key_idx ON notification_log (user_id, dedup_key);
