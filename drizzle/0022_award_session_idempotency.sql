-- Award-session idempotency — supports lib/award-session.ts (the shared Watts
-- award path called by both PATCH /api/sessions and the offline sync ingest).
-- See docs/mobile-conversion-plan.md §8 (durable-outbox audit) + mobile-build-todo Sprint 3.
--
-- Hand-applied like 0012-0021. Additive + IF NOT EXISTS, so order vs the analytics
-- 0021 migration doesn't matter. (Numbered 0022 to sequence after 0021_analytics_events_v2.)

ALTER TABLE `watts_transactions` ADD COLUMN `source_session_id` text;

-- One award per (user, session). Partial-unique (same pattern as 0019) so legacy
-- NULL rows coexist; the activity tx uses sessionId, the streak-bonus tx uses
-- "<sessionId>:streak", so both can exist for one session without colliding.
CREATE UNIQUE INDEX IF NOT EXISTS `uniq_watts_tx_source_session`
  ON `watts_transactions` (`user_id`, `source_session_id`)
  WHERE `source_session_id` IS NOT NULL;
