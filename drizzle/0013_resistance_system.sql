-- Resistance & Reward System Migration
-- Adds last_penalty_date column for tracking resistance penalties

ALTER TABLE users ADD COLUMN last_penalty_date INTEGER;
