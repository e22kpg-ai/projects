ALTER TABLE `user` ADD `status` text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `affiliation` text;--> statement-breakpoint
-- Backfill, hand-written: every account that existed before the approval
-- workflow must count as already approved.
--
-- Without this, the ADD COLUMN above stamps 'pending' onto every existing row,
-- including the only admin. On deploy that locks the entire organisation out at
-- once, and nobody can reach /admin/users to fix it, because reaching it
-- requires an approved admin. The only way back would be editing the production
-- database by hand.
--
-- Safe to run once, at the moment the column is introduced: at this point no
-- account can legitimately be pending yet.
UPDATE `user` SET `status` = 'approved';
