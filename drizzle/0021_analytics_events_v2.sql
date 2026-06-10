-- Analytics events v2 — platform/session/anon/funnel columns + batch idempotency.
-- See docs/analytics-instrumentation-plan.md §3.
--
-- Hand-applied like 0012-0020 (this repo does not maintain drizzle's _journal
-- past idx 11). All adds are nullable or constant-default, so SQLite
-- ALTER TABLE ADD COLUMN is metadata-only and existing rows survive.

ALTER TABLE `analytics_events` ADD COLUMN `event_id` text;
ALTER TABLE `analytics_events` ADD COLUMN `anon_id` text;
ALTER TABLE `analytics_events` ADD COLUMN `session_id` text;
ALTER TABLE `analytics_events` ADD COLUMN `platform` text NOT NULL DEFAULT 'web';
ALTER TABLE `analytics_events` ADD COLUMN `app_version` text;
ALTER TABLE `analytics_events` ADD COLUMN `os_version` text;
ALTER TABLE `analytics_events` ADD COLUMN `device_model` text;
ALTER TABLE `analytics_events` ADD COLUMN `funnel` text;
ALTER TABLE `analytics_events` ADD COLUMN `step` text;
ALTER TABLE `analytics_events` ADD COLUMN `properties` text;
ALTER TABLE `analytics_events` ADD COLUMN `client_ts` integer;

-- event_id is the client-minted idempotency key. Partial unique index (same
-- pattern as 0019 for users.apple_original_tx_id) so legacy NULL rows coexist
-- and offline batch retries dedupe via INSERT ... ON CONFLICT DO NOTHING.
CREATE UNIQUE INDEX IF NOT EXISTS `uniq_analytics_event_id`
  ON `analytics_events` (`event_id`)
  WHERE `event_id` IS NOT NULL;

-- Funnel-scan composites (supersede the single-column indexes from 0016, which
-- are left in place — they're tiny).
CREATE INDEX IF NOT EXISTS `idx_ae_event_created` ON `analytics_events` (`event`, `created_at`);
CREATE INDEX IF NOT EXISTS `idx_ae_user_created` ON `analytics_events` (`user_id`, `created_at`);
CREATE INDEX IF NOT EXISTS `idx_ae_anon_created` ON `analytics_events` (`anon_id`, `created_at`);
CREATE INDEX IF NOT EXISTS `idx_ae_session_created` ON `analytics_events` (`session_id`, `created_at`);
CREATE INDEX IF NOT EXISTS `idx_ae_funnel_step` ON `analytics_events` (`funnel`, `step`, `created_at`);
