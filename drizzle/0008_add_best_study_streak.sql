-- Add best_study_streak column to track all-time best daily streak
ALTER TABLE users ADD COLUMN best_study_streak INTEGER NOT NULL DEFAULT 0;

-- Seed best_study_streak with current study_streak for existing users
UPDATE users SET best_study_streak = study_streak WHERE study_streak > 0;
