-- Mobile foundation: schema additions to unblock mobile sprint 1.
-- See docs/mobile-api-audit.md §4 (Backend prep checklist) and §5 (open question resolutions).
--
-- Adds:
--   1. users columns: deleted_at, timezone, subscription_source, apple_original_tx_id, notification_prefs
--   2. refresh_tokens — mobile auth (strict rotation w/ 30s grace; per OQ#2)
--   3. push_tokens — Expo push registration
--   4. linked_providers — multi-provider account linking (Section D-16)
--   5. sync_event_log — offline-first idempotency (Section 3 Sync recommendation)
--   6. link_codes — Hide-My-Email pre-auth linking (OQ#5)

-- ── users: additive columns ────────────────────────────────────────────────
ALTER TABLE `users` ADD COLUMN `deleted_at` integer;
ALTER TABLE `users` ADD COLUMN `timezone` text;
ALTER TABLE `users` ADD COLUMN `subscription_source` text;
ALTER TABLE `users` ADD COLUMN `apple_original_tx_id` text;
ALTER TABLE `users` ADD COLUMN `notification_prefs` text NOT NULL DEFAULT '{}';

-- SQLite ALTER TABLE can't add UNIQUE; emulate with a unique index.
-- Partial index excludes NULLs (multiple NULLs allowed; only non-null values must be unique).
CREATE UNIQUE INDEX IF NOT EXISTS `users_apple_original_tx_id_unique`
  ON `users` (`apple_original_tx_id`)
  WHERE `apple_original_tx_id` IS NOT NULL;

-- ── refresh_tokens ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `device_id` text NOT NULL,
  `token_hash` text NOT NULL UNIQUE,
  `rotated_to_hash` text,
  `rotated_at` integer,
  `revoked_at` integer,
  `created_at` integer NOT NULL,
  `expires_at` integer NOT NULL,
  `last_used_at` integer
);

CREATE INDEX IF NOT EXISTS `refresh_tokens_user_device_idx`
  ON `refresh_tokens` (`user_id`, `device_id`);

-- ── push_tokens ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `push_tokens` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `token` text NOT NULL UNIQUE,
  `device_id` text NOT NULL,
  `platform` text NOT NULL,
  `created_at` integer NOT NULL,
  `last_used_at` integer
);

CREATE INDEX IF NOT EXISTS `push_tokens_user_idx`
  ON `push_tokens` (`user_id`);

-- ── linked_providers ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `linked_providers` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `provider` text NOT NULL,
  `provider_subject` text NOT NULL,
  `linked_at` integer NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `linked_providers_provider_subject_idx`
  ON `linked_providers` (`provider`, `provider_subject`);

CREATE INDEX IF NOT EXISTS `linked_providers_user_idx`
  ON `linked_providers` (`user_id`);

-- ── sync_event_log ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `sync_event_log` (
  `id` text PRIMARY KEY NOT NULL,
  `device_id` text NOT NULL,
  `batch_id` text NOT NULL,
  `client_id` text NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `processed_at` integer NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `sync_event_log_idempotency_idx`
  ON `sync_event_log` (`device_id`, `batch_id`, `client_id`);

CREATE INDEX IF NOT EXISTS `sync_event_log_processed_at_idx`
  ON `sync_event_log` (`processed_at`);

-- ── link_codes ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `link_codes` (
  `id` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL,
  `provider` text NOT NULL,
  `provider_subject` text NOT NULL,
  `code_hash` text NOT NULL,
  `expires_at` integer NOT NULL,
  `consumed_at` integer,
  `created_at` integer NOT NULL
);

CREATE INDEX IF NOT EXISTS `link_codes_email_idx`
  ON `link_codes` (`email`);

CREATE INDEX IF NOT EXISTS `link_codes_expires_at_idx`
  ON `link_codes` (`expires_at`);
