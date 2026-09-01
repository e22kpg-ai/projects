ALTER TABLE `user` ADD `role` text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `department` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `chairperson` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `dress_code` text;--> statement-breakpoint
ALTER TABLE `rooms` ADD `equipment` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `rooms` ADD `owner_name` text;