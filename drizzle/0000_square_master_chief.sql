CREATE TABLE IF NOT EXISTS "idealite_page" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"path" text,
	"primary_tag_id" uuid,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "idealite_pages_tags" (
	"page_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "idealite_pages_tags_page_id_tag_id_pk" PRIMARY KEY("page_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "idealite_tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"parent_id" uuid,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted" boolean DEFAULT false,
	CONSTRAINT "idealite_tag_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "idealite_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fid" integer,
	"custody_address" varchar(256),
	"username" varchar(256),
	"display_name" varchar(256),
	"pfp_url" varchar(256),
	"bio" text,
	"role" varchar(50) DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "idealite_users_pages" (
	"user_id" uuid NOT NULL,
	"page_id" uuid NOT NULL,
	"role" varchar(50) DEFAULT 'owner' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "idealite_users_pages_user_id_page_id_pk" PRIMARY KEY("user_id","page_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "idealite_users_tags" (
	"user_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "idealite_users_tags_user_id_tag_id_pk" PRIMARY KEY("user_id","tag_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "idealite_pages_tags" ADD CONSTRAINT "idealite_pages_tags_page_id_idealite_page_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."idealite_page"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "idealite_pages_tags" ADD CONSTRAINT "idealite_pages_tags_tag_id_idealite_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."idealite_tag"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "idealite_tag" ADD CONSTRAINT "idealite_tag_parent_id_idealite_tag_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."idealite_tag"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "idealite_users_pages" ADD CONSTRAINT "idealite_users_pages_user_id_idealite_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."idealite_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "idealite_users_pages" ADD CONSTRAINT "idealite_users_pages_page_id_idealite_page_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."idealite_page"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "idealite_users_tags" ADD CONSTRAINT "idealite_users_tags_user_id_idealite_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."idealite_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "idealite_users_tags" ADD CONSTRAINT "idealite_users_tags_tag_id_idealite_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."idealite_tag"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "page_created_at_idx" ON "idealite_page" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "page_deleted_idx" ON "idealite_page" USING btree ("deleted");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "page_id_idx" ON "idealite_pages_tags" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tag_id_idx" ON "idealite_pages_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tag_name_idx" ON "idealite_tag" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tag_created_at_idx" ON "idealite_tag" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tag_deleted_idx" ON "idealite_tag" USING btree ("deleted");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_pages_user_id_idx" ON "idealite_users_pages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_pages_page_id_idx" ON "idealite_users_pages" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_pages_role_idx" ON "idealite_users_pages" USING btree ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_tags_user_id_idx" ON "idealite_users_tags" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_tags_tag_id_idx" ON "idealite_users_tags" USING btree ("tag_id");