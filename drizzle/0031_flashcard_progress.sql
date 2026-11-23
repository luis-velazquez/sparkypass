CREATE TABLE IF NOT EXISTS `flashcard_progress` (
  `user_id` text NOT NULL,
  `question_id` text NOT NULL,
  `status` text NOT NULL,
  `knows` integer DEFAULT 0 NOT NULL,
  `know_day` integer,
  `step` integer DEFAULT 0 NOT NULL,
  `due_day` integer,
  `introduced_day` integer,
  `last_again_day` integer,
  `updated_at` integer NOT NULL,
  `changed_at` integer NOT NULL,
  PRIMARY KEY(`user_id`, `question_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS `flashcard_progress_changed_idx`
  ON `flashcard_progress` (`user_id`,`changed_at`,`question_id`);

CREATE TABLE IF NOT EXISTS `flashcard_marks` (
  `user_id` text NOT NULL,
  `id` text NOT NULL,
  `question_id` text NOT NULL,
  `lang` text NOT NULL,
  `field` text NOT NULL,
  `kind` text DEFAULT 'user' NOT NULL,
  `start_offset` integer NOT NULL,
  `end_offset` integer NOT NULL,
  `quote` text NOT NULL,
  `prefix` text NOT NULL,
  `suffix` text NOT NULL,
  `text_hash` text NOT NULL,
  `key_hash` text NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  `deleted_at` integer,
  `changed_at` integer NOT NULL,
  PRIMARY KEY(`user_id`, `id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS `flashcard_marks_changed_idx`
  ON `flashcard_marks` (`user_id`,`changed_at`,`id`);
