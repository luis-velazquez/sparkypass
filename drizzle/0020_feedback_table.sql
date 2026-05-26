-- Feedback persistence — audit OQ#9 anti-spam mitigation.
-- See docs/mobile-conversion-plan.md §C resolution 9.

CREATE TABLE IF NOT EXISTS `feedback` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `type` text NOT NULL,
  `message` text NOT NULL,
  `page` text,
  `moderation_status` text NOT NULL DEFAULT 'pending',
  `rewarded_at` integer,
  `created_at` integer NOT NULL
);

CREATE INDEX IF NOT EXISTS `feedback_user_idx` ON `feedback` (`user_id`);
CREATE INDEX IF NOT EXISTS `feedback_moderation_idx` ON `feedback` (`moderation_status`);
CREATE INDEX IF NOT EXISTS `feedback_created_at_idx` ON `feedback` (`created_at`);
