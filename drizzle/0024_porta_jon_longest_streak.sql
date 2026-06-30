-- Porta Jon Challenge: endless streak run. Once the user gets 3 right in a row
-- the challenge keeps serving questions until they miss; this column persists
-- their all-time best consecutive-correct streak (personal record). The client
-- only ever answers correctly until the run-ending miss, so questionsCorrect ==
-- the run's streak, and awardSession stores max(existing, questionsCorrect).
ALTER TABLE users ADD COLUMN porta_jon_longest_streak INTEGER NOT NULL DEFAULT 0;
