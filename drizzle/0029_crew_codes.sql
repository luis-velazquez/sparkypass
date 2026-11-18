-- Throne Room crew invites (2026-11-17).
-- crew_codes: each user's shareable crew code, one per user (a reset replaces
-- it). Entering someone's code puts you on each other's crew.
-- crew_invite_emails: invite emails sent to addresses that have no account,
-- for the daily cap per sender and the cooldown per address. Only a SHA-256
-- of the address is stored, never the address itself.
CREATE TABLE IF NOT EXISTS `crew_codes` (
	`user_id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX IF NOT EXISTS `crew_codes_code_unique` ON `crew_codes` (`code`);
CREATE TABLE IF NOT EXISTS `crew_invite_emails` (
	`id` text PRIMARY KEY NOT NULL,
	`inviter_id` text NOT NULL,
	`email_hash` text NOT NULL,
	`sent_at` integer NOT NULL,
	FOREIGN KEY (`inviter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS `crew_invite_emails_inviter_sent_idx` ON `crew_invite_emails` (`inviter_id`,`sent_at`);
CREATE INDEX IF NOT EXISTS `crew_invite_emails_hash_sent_idx` ON `crew_invite_emails` (`email_hash`,`sent_at`);
