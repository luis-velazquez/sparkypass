-- Free automatic weekly streak skip.
-- One missed day is forgiven automatically, at most once per rolling 7 days
-- (replaces the paid "Streak Fuse" power-up). Tracks when the free skip was last
-- auto-consumed; a NULL value means a skip is available. See lib/streak.ts and
-- lib/award-session.ts.
--
-- The legacy `streak_fuse_expires_at` column (migration 0012) is now dormant and
-- intentionally left in place — no destructive drop.
ALTER TABLE users ADD COLUMN streak_skip_used_at INTEGER;
