-- Game mastery state: tracks mastery-based pack unlocking for Index Sniper & Translation Engine
CREATE TABLE IF NOT EXISTS `game_mastery_state` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `game_id` text NOT NULL,
  `unlocked_pack_index` integer NOT NULL DEFAULT 0,
  `best_streak` integer NOT NULL DEFAULT 0,
  `updated_at` integer NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `game_mastery_user_game` ON `game_mastery_state` (`user_id`, `game_id`);
