-- Porta Jon Challenge: break-time 3-question journeyman-knowledge quiz.
-- Adds the throne streak (consecutive-day), the 2h-cooldown timestamp
-- (throne_last_completed_at), and the scrolls-dodged lifetime counter
-- (anti-doomscroll tally + the metric the title ladder is keyed off).
ALTER TABLE users ADD COLUMN throne_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN throne_streak_best INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN throne_last_completed_at INTEGER;
ALTER TABLE users ADD COLUMN scrolls_dodged INTEGER NOT NULL DEFAULT 0;
