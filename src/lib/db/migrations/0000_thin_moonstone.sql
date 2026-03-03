CREATE TABLE `leads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`full_name` text,
	`bio` text,
	`followers` integer DEFAULT 0 NOT NULL,
	`following` integer DEFAULT 0 NOT NULL,
	`posts_count` integer DEFAULT 0 NOT NULL,
	`profile_url` text DEFAULT '' NOT NULL,
	`avatar_url` text,
	`nicho` text DEFAULT '' NOT NULL,
	`location` text,
	`score` integer DEFAULT 0 NOT NULL,
	`score_breakdown` text DEFAULT '{}' NOT NULL,
	`status` text DEFAULT 'Novo' NOT NULL,
	`status_updated_at` integer,
	`collected_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leads_username_unique` ON `leads` (`username`);--> statement-breakpoint
CREATE INDEX `leads_status_idx` ON `leads` (`status`);--> statement-breakpoint
CREATE INDEX `leads_nicho_idx` ON `leads` (`nicho`);--> statement-breakpoint
CREATE INDEX `leads_score_idx` ON `leads` (`score`);--> statement-breakpoint
CREATE INDEX `leads_collected_at_idx` ON `leads` (`collected_at`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lead_id` integer NOT NULL,
	`content` text NOT NULL,
	`approved` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `messages_approved_idx` ON `messages` (`approved`);--> statement-breakpoint
CREATE INDEX `messages_lead_id_idx` ON `messages` (`lead_id`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_key_unique` ON `settings` (`key`);