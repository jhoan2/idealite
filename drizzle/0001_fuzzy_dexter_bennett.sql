ALTER TABLE "idealite_page" DROP CONSTRAINT "idealite_page_name_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "page_name_idx";--> statement-breakpoint
ALTER TABLE "idealite_page" ALTER COLUMN "title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "idealite_page" DROP COLUMN IF EXISTS "name";