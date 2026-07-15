-- Native-auth mobile codes (PRD: sparkypass-mobile/tasks/prd-native-auth.md).
-- 6-digit emailed codes for in-app email verification and password reset.
-- Mirrors link_codes (SHA-256 at rest, TTL, consumed_at) plus an attempts
-- counter so a code dies after 5 wrong guesses.
CREATE TABLE `auth_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`purpose` text NOT NULL,
	`code_hash` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`expires_at` integer NOT NULL,
	`consumed_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `auth_codes_email_purpose_idx` ON `auth_codes` (`email`,`purpose`);
CREATE INDEX `auth_codes_expires_at_idx` ON `auth_codes` (`expires_at`);
