CREATE TYPE "public"."entity_type" AS ENUM('page', 'tag', 'card', 'resource', 'folder', 'user');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('unread', 'read', 'reversed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('info', 'creation', 'deletion', 'update', 'suggestion');--> statement-breakpoint
CREATE TABLE "idealite_card" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"page_id" uuid,
	"resource_id" uuid,
	"card_type" varchar,
	"question" text,
	"answer" text,
	"cloze_template" text,
	"cloze_answers" text,
	"content" text,
	"image_cid" text,
	"description" text,
	"last_reviewed" timestamp with time zone,
	"next_review" timestamp with time zone,
	"mastered_at" timestamp with time zone,
	"status" varchar DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted" boolean DEFAULT false,
	"source_locator" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idealite_cards_tags" (
	"card_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "idealite_cards_tags_card_id_tag_id_pk" PRIMARY KEY("card_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "idealite_feature_discoveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"feature_key" text NOT NULL,
	"discovered_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idealite_folder" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"tag_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"parent_folder_id" uuid,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "idealite_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"filename" varchar(256) NOT NULL,
	"url" varchar(1024) NOT NULL,
	"size" integer NOT NULL,
	"is_temporary" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idealite_integration_credential" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(32) NOT NULL,
	"type" varchar(16) NOT NULL,
	"hashed_token" varchar(256),
	"access_token_enc" text,
	"refresh_token_enc" text,
	"expires_at" timestamp with time zone,
	"scope" text[] DEFAULT ARRAY[]::text[],
	"last_used" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "idealite_notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"notification_type" "notification_type" NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text,
	"status" "notification_status" DEFAULT 'unread' NOT NULL,
	"status_changed_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"context_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "idealite_page" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"canvas_image_cid" text,
	"content" text,
	"content_type" varchar DEFAULT 'page' NOT NULL,
	"primary_tag_id" uuid,
	"folder_id" uuid,
	"description" text,
	"image_previews" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted" boolean DEFAULT false,
	"archived" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "idealite_pages_tags" (
	"page_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "idealite_pages_tags_page_id_tag_id_pk" PRIMARY KEY("page_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "idealite_resource" (
	"author" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"date_published" timestamp with time zone,
	"description" text,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image" text,
	"og_type" text,
	"open_library_id" text,
	"owner_id" uuid,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"updated_at" timestamp with time zone,
	"url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idealite_resources_pages" (
	"resource_id" uuid NOT NULL,
	"page_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "idealite_resources_pages_resource_id_page_id_pk" PRIMARY KEY("resource_id","page_id")
);
--> statement-breakpoint
CREATE TABLE "idealite_tabs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"path" text NOT NULL,
	"position" integer NOT NULL,
	"is_active" boolean DEFAULT false,
	"is_pinned" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "idealite_tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"parent_id" uuid,
	"embedding" vector(1536),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted" boolean DEFAULT false,
	"is_template" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idealite_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" varchar(256),
	"email" varchar(256),
	"fid" integer,
	"custody_address" varchar(256),
	"username" varchar(256),
	"display_name" varchar(256),
	"pfp_url" varchar(256),
	"avatar_url" varchar(256),
	"bio" text,
	"role" varchar(50) DEFAULT 'user' NOT NULL,
	"is_onboarded" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"storage_used" integer DEFAULT 0 NOT NULL,
	"storage_limit" integer DEFAULT 1073741824 NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "idealite_user_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
CREATE TABLE "idealite_users_resources" (
	"user_id" uuid NOT NULL,
	"resource_id" uuid NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "idealite_users_resources_user_id_resource_id_pk" PRIMARY KEY("user_id","resource_id")
);
--> statement-breakpoint
CREATE TABLE "idealite_users_folders" (
	"user_id" uuid NOT NULL,
	"folder_id" uuid NOT NULL,
	"is_collapsed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "idealite_users_folders_user_id_folder_id_pk" PRIMARY KEY("user_id","folder_id")
);
--> statement-breakpoint
CREATE TABLE "idealite_users_pages" (
	"user_id" uuid NOT NULL,
	"page_id" uuid NOT NULL,
	"role" varchar(50) DEFAULT 'owner' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "idealite_users_pages_user_id_page_id_pk" PRIMARY KEY("user_id","page_id")
);
--> statement-breakpoint
CREATE TABLE "idealite_users_tags" (
	"user_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"is_collapsed" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "idealite_users_tags_user_id_tag_id_pk" PRIMARY KEY("user_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "idealite_card" ADD CONSTRAINT "idealite_card_user_id_idealite_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."idealite_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idealite_card" ADD CONSTRAINT "idealite_card_page_id_idealite_page_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."idealite_page"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idealite_card" ADD CONSTRAINT "idealite_card_resource_id_idealite_resource_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."idealite_resource"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idealite_cards_tags" ADD CONSTRAINT "idealite_cards_tags_card_id_idealite_card_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."idealite_card"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idealite_cards_tags" ADD CONSTRAINT "idealite_cards_tags_tag_id_idealite_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."idealite_tag"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idealite_feature_discoveries" ADD CONSTRAINT "idealite_feature_discoveries_user_id_idealite_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."idealite_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idealite_folder" ADD CONSTRAINT "idealite_folder_tag_id_idealite_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."idealite_tag"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idealite_folder" ADD CONSTRAINT "idealite_folder_user_id_idealite_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."idealite_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idealite_folder" ADD CONSTRAINT "idealite_folder_parent_folder_id_idealite_folder_id_fk" FOREIGN KEY ("parent_folder_id") REFERENCES "public"."idealite_folder"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idealite_images" ADD CONSTRAINT "idealite_images_user_id_idealite_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."idealite_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idealite_integration_credential" ADD CONSTRAINT "idealite_integration_credential_user_id_idealite_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."idealite_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idealite_notification" ADD CONSTRAINT "idealite_notification_user_id_idealite_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."idealite_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idealite_page" ADD CONSTRAINT "idealite_page_folder_id_idealite_folder_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."idealite_folder"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idealite_pages_tags" ADD CONSTRAINT "idealite_pages_tags_page_id_idealite_page_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."idealite_page"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idealite_pages_tags" ADD CONSTRAINT "idealite_pages_tags_tag_id_idealite_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."idealite_tag"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idealite_resource" ADD CONSTRAINT "idealite_resource_owner_id_idealite_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."idealite_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idealite_resources_pages" ADD CONSTRAINT "idealite_resources_pages_resource_id_idealite_resource_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."idealite_resource"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idealite_resources_pages" ADD CONSTRAINT "idealite_resources_pages_page_id_idealite_page_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."idealite_page"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idealite_tabs" ADD CONSTRAINT "idealite_tabs_user_id_idealite_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."idealite_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idealite_tag" ADD CONSTRAINT "idealite_tag_parent_id_idealite_tag_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."idealite_tag"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idealite_users_resources" ADD CONSTRAINT "idealite_users_resources_user_id_idealite_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."idealite_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idealite_users_resources" ADD CONSTRAINT "idealite_users_resources_resource_id_idealite_resource_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."idealite_resource"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idealite_users_folders" ADD CONSTRAINT "idealite_users_folders_user_id_idealite_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."idealite_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idealite_users_folders" ADD CONSTRAINT "idealite_users_folders_folder_id_idealite_folder_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."idealite_folder"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idealite_users_pages" ADD CONSTRAINT "idealite_users_pages_user_id_idealite_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."idealite_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idealite_users_pages" ADD CONSTRAINT "idealite_users_pages_page_id_idealite_page_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."idealite_page"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idealite_users_tags" ADD CONSTRAINT "idealite_users_tags_user_id_idealite_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."idealite_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idealite_users_tags" ADD CONSTRAINT "idealite_users_tags_tag_id_idealite_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."idealite_tag"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "card_user_idx" ON "idealite_card" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "card_page_idx" ON "idealite_card" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "card_resource_idx" ON "idealite_card" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "card_content_search_idx" ON "idealite_card" USING gin (to_tsvector('english', "content"));--> statement-breakpoint
CREATE INDEX "card_status_idx" ON "idealite_card" USING btree ("status");--> statement-breakpoint
CREATE INDEX "card_deleted_idx" ON "idealite_card" USING btree ("deleted");--> statement-breakpoint
CREATE INDEX "cards_tags_card_idx" ON "idealite_cards_tags" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "cards_tags_tag_idx" ON "idealite_cards_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "user_feature_idx" ON "idealite_feature_discoveries" USING btree ("user_id","feature_key");--> statement-breakpoint
CREATE INDEX "folder_tag_id_idx" ON "idealite_folder" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "folder_user_id_idx" ON "idealite_folder" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "integration_credentials_token_prefix_idx" ON "idealite_integration_credential" USING btree ("hashed_token");--> statement-breakpoint
CREATE INDEX "notification_user_id_idx" ON "idealite_notification" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_event_type_idx" ON "idealite_notification" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "notification_entity_idx" ON "idealite_notification" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "notification_status_changed_idx" ON "idealite_notification" USING btree ("status_changed_at");--> statement-breakpoint
CREATE INDEX "page_created_at_idx" ON "idealite_page" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "page_deleted_idx" ON "idealite_page" USING btree ("deleted");--> statement-breakpoint
CREATE INDEX "page_archived_idx" ON "idealite_page" USING btree ("archived");--> statement-breakpoint
CREATE INDEX "page_primary_tag_id_idx" ON "idealite_page" USING btree ("primary_tag_id");--> statement-breakpoint
CREATE INDEX "page_title_search_idx" ON "idealite_page" USING gin (to_tsvector('english', "title"));--> statement-breakpoint
CREATE INDEX "page_id_idx" ON "idealite_pages_tags" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "tag_id_idx" ON "idealite_pages_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "resource_url_idx" ON "idealite_resource" USING btree ("url");--> statement-breakpoint
CREATE INDEX "resource_created_at_idx" ON "idealite_resource" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_resource_title_tsv" ON "idealite_resource" USING gin (to_tsvector('english', "title"));--> statement-breakpoint
CREATE INDEX "idx_resource_url_tsv" ON "idealite_resource" USING gin (to_tsvector('english', "url"));--> statement-breakpoint
CREATE INDEX "idx_resource_author_tsv" ON "idealite_resource" USING gin (to_tsvector('english', "author"));--> statement-breakpoint
CREATE INDEX "idx_resource_open_library_id_idx" ON "idealite_resource" USING btree ("open_library_id");--> statement-breakpoint
CREATE INDEX "resources_pages_resource_id_idx" ON "idealite_resources_pages" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "resources_pages_page_id_idx" ON "idealite_resources_pages" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "tabs_user_idx" ON "idealite_tabs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tabs_position_idx" ON "idealite_tabs" USING btree ("position");--> statement-breakpoint
CREATE INDEX "tabs_path_idx" ON "idealite_tabs" USING btree ("path");--> statement-breakpoint
CREATE INDEX "tag_name_idx" ON "idealite_tag" USING btree ("name");--> statement-breakpoint
CREATE INDEX "tag_created_at_idx" ON "idealite_tag" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tag_deleted_idx" ON "idealite_tag" USING btree ("deleted");--> statement-breakpoint
CREATE INDEX "tag_embedding_ivfflat" ON "idealite_tag" USING ivfflat (embedding vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "users_resources_user_id_idx" ON "idealite_users_resources" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_resources_resource_id_idx" ON "idealite_users_resources" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "users_folders_user_id_idx" ON "idealite_users_folders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_folders_folder_id_idx" ON "idealite_users_folders" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "users_pages_user_id_idx" ON "idealite_users_pages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_pages_page_id_idx" ON "idealite_users_pages" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "users_pages_role_idx" ON "idealite_users_pages" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_tags_user_id_idx" ON "idealite_users_tags" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_tags_tag_id_idx" ON "idealite_users_tags" USING btree ("tag_id");