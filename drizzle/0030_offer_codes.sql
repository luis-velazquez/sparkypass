-- $0.99 first-month offer (HQ Plan/sparkypass-offer-emails-plan.md, v0.2).
--
-- offer_codes: one-time App Store offer codes imported from App Store Connect
-- (scripts/import-offer-codes.mjs). A code is given to at most one user, and
-- each user gets at most one code. user_id has no foreign key on purpose: when
-- an account is hard-deleted the code must stay used (it may have been
-- redeemed), never go back into the pool.
CREATE TABLE IF NOT EXISTS offer_codes (
  code TEXT PRIMARY KEY NOT NULL,
  batch TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  user_id TEXT,
  given_at INTEGER,
  imported_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS offer_codes_user_idx ON offer_codes (user_id);
CREATE INDEX IF NOT EXISTS offer_codes_pool_idx ON offer_codes (user_id, expires_at);

-- offer_messages: one row per user per message (day-6 email, day-15 email,
-- day-19 email, day-15 push), so nobody gets the same message twice. version
-- is A or B for the day-15 email (E-11).
CREATE TABLE IF NOT EXISTS offer_messages (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  version TEXT,
  code TEXT,
  provider_id TEXT,
  sent_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS offer_messages_user_message_idx ON offer_messages (user_id, message);
CREATE INDEX IF NOT EXISTS offer_messages_sent_at_idx ON offer_messages (sent_at);
