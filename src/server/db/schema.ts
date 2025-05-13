// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql, relations } from "drizzle-orm";
import {
  index,
  pgTableCreator,
  timestamp,
  varchar,
  uuid,
  integer,
  text,
  boolean,
  AnyPgColumn,
  primaryKey,
  pgEnum,
  jsonb,
  serial,
} from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `idealite_${name}`);

export const users = createTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerk_id: varchar("clerk_id", { length: 256 }).unique(),
  email: varchar("email", { length: 256 }),
  fid: integer("fid"),
  custody_address: varchar("custody_address", { length: 256 }),
  username: varchar("username", { length: 256 }),
  display_name: varchar("display_name", { length: 256 }),
  pfp_url: varchar("pfp_url", { length: 256 }),
  avatar_url: varchar("avatar_url", { length: 256 }),
  bio: text("bio"),
  role: varchar("role", { length: 50 }).default("user").notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  storage_used: integer("storage_used").notNull().default(0),
  storage_limit: integer("storage_limit").notNull().default(1073741824),
  updated_at: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export type Image = typeof images.$inferSelect;
export const images = createTable("images", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  filename: varchar("filename", { length: 256 }).notNull(),
  url: varchar("url", { length: 1024 }).notNull(),
  size: integer("size").notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export type Tag = typeof tags.$inferSelect;
export const tags = createTable(
  "tag",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name")
      .notNull()
      .$default(() => sql`lower(name)`),
    parent_id: uuid("parent_id").references((): AnyPgColumn => tags.id),
    created_at: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
    deleted: boolean("deleted").default(false),
    is_template: boolean("is_template").default(false).notNull(),
  },
  (table) => {
    return {
      name_idx: index("tag_name_idx").on(table.name),
      created_at_idx: index("tag_created_at_idx").on(table.created_at),
      deleted_idx: index("tag_deleted_idx").on(table.deleted),
    };
  },
);

export const users_tags = createTable(
  "users_tags",
  {
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id),
    tag_id: uuid("tag_id")
      .notNull()
      .references(() => tags.id),
    is_collapsed: boolean("is_collapsed").default(false).notNull(),
    is_archived: boolean("is_archived").default(false).notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.user_id, table.tag_id] }),
      user_id_idx: index("users_tags_user_id_idx").on(table.user_id),
      tag_id_idx: index("users_tags_tag_id_idx").on(table.tag_id),
    };
  },
);

export type Page = typeof pages.$inferSelect;
export const pages = createTable(
  "page",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title")
      .notNull()
      .$default(() => sql`lower(title)`),
    canvas_image_cid: text("canvas_image_cid"),
    content: text("content"),
    content_type: varchar("content_type", { enum: ["page", "canvas"] })
      .notNull()
      .default("page"),
    primary_tag_id: uuid("primary_tag_id"),
    folder_id: uuid("folder_id").references(() => folders.id),
    created_at: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
    deleted: boolean("deleted").default(false),
  },
  (table) => {
    return {
      created_at_idx: index("page_created_at_idx").on(table.created_at),
      deleted_idx: index("page_deleted_idx").on(table.deleted),
      primary_tag_id_idx: index("page_primary_tag_id_idx").on(
        table.primary_tag_id,
      ),
      title_search_idx: index("page_title_search_idx").using(
        "gin",
        sql`to_tsvector('english', ${table.title})`,
      ),
    };
  },
);

export const pages_tags = createTable(
  "pages_tags",
  {
    page_id: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    tag_id: uuid("tag_id")
      .notNull()
      .references(() => tags.id),
    created_at: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.page_id, table.tag_id] }),
      page_id_idx: index("page_id_idx").on(table.page_id),
      tag_id_idx: index("tag_id_idx").on(table.tag_id),
    };
  },
);

export const users_pages = createTable(
  "users_pages",
  {
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id),
    page_id: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 50 }).default("owner").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.user_id, table.page_id] }),
      user_id_idx: index("users_pages_user_id_idx").on(table.user_id),
      page_id_idx: index("users_pages_page_id_idx").on(table.page_id),
      role_idx: index("users_pages_role_idx").on(table.role),
    };
  },
);

export const resources = createTable(
  "resource",
  {
    //Authors is a string with multiple authors separated by commas
    author: text("author"),
    created_at: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    date_published: timestamp("date_published", { withTimezone: true }),
    description: text("description"),
    id: uuid("id").defaultRandom().primaryKey(),
    image: text("image"),
    og_type: text("og_type"),
    open_library_id: text("open_library_id"),
    owner_id: uuid("owner_id").references(() => users.id),
    title: text("title").notNull(),
    type: text("type", {
      enum: ["url", "crossref", "open_library"],
    }).notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
    url: text("url").notNull(),
  },
  (table) => {
    return {
      url_idx: index("resource_url_idx").on(table.url),
      created_at_idx: index("resource_created_at_idx").on(table.created_at),
      title_tsv_idx: index("idx_resource_title_tsv").using(
        "gin",
        sql`to_tsvector('english', ${table.title})`,
      ),
      url_tsv_idx: index("idx_resource_url_tsv").using(
        "gin",
        sql`to_tsvector('english', ${table.url})`,
      ),
      author_tsv_idx: index("idx_resource_author_tsv").using(
        "gin",
        sql`to_tsvector('english', ${table.author})`,
      ),
      open_library_id_idx: index("idx_resource_open_library_id_idx").on(
        table.open_library_id,
      ),
    };
  },
);

export const usersResources = createTable(
  "users_resources",
  {
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id),
    resource_id: uuid("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),
    isArchived: boolean("is_archived").default(false).notNull(),
    // isSubscribed: boolean("is_subscribed").default(false).notNull(),

    // notificationPreferences: jsonb("notification_preferences").default({
    //   updates: false,
    //   comments: false,
    // }),

    created_at: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.user_id, table.resource_id] }),
      user_id_idx: index("users_resources_user_id_idx").on(table.user_id),
      resource_id_idx: index("users_resources_resource_id_idx").on(
        table.resource_id,
      ),
    };
  },
);

export const resourcesPages = createTable(
  "resources_pages",
  {
    resource_id: uuid("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),
    page_id: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    created_at: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.resource_id, table.page_id] }),
      resource_id_idx: index("resources_pages_resource_id_idx").on(
        table.resource_id,
      ),
      page_id_idx: index("resources_pages_page_id_idx").on(table.page_id),
    };
  },
);

export const tabs = createTable(
  "tabs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    path: text("path").notNull(),
    position: integer("position").notNull(),
    is_active: boolean("is_active").default(false),
    is_pinned: boolean("is_pinned").default(false),
    created_at: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (table) => ({
    user_idx: index("tabs_user_idx").on(table.user_id),
    position_idx: index("tabs_position_idx").on(table.position),
    path_idx: index("tabs_path_idx").on(table.path),
  }),
);

export type Folder = typeof folders.$inferSelect;
export const folders = createTable(
  "folder",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    tag_id: uuid("tag_id")
      .notNull()
      .references(() => tags.id),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id),
    parent_folder_id: uuid("parent_folder_id").references(
      (): AnyPgColumn => folders.id,
      {
        onDelete: "cascade",
      },
    ),
    created_at: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (table) => {
    return {
      tag_id_idx: index("folder_tag_id_idx").on(table.tag_id),
      user_id_idx: index("folder_user_id_idx").on(table.user_id),
    };
  },
);

export const users_folders = createTable(
  "users_folders",
  {
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id),
    folder_id: uuid("folder_id")
      .notNull()
      .references(() => folders.id, { onDelete: "cascade" }),
    is_collapsed: boolean("is_collapsed").default(false).notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.user_id, table.folder_id] }),
      user_id_idx: index("users_folders_user_id_idx").on(table.user_id),
      folder_id_idx: index("users_folders_folder_id_idx").on(table.folder_id),
    };
  },
);

export const cards = createTable(
  "card",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id),
    page_id: uuid("page_id").references(() => pages.id),
    resource_id: uuid("resource_id").references(() => resources.id),
    card_type: varchar("card_type", {
      enum: ["qa", "image", "cloze"],
    }),
    question: text("question"),
    answer: text("answer"),
    cloze_template: text("cloze_template"),
    cloze_answers: text("cloze_answers"),
    content: text("content"),
    image_cid: text("image_cid"),
    description: text("description"),
    last_reviewed: timestamp("last_reviewed", { withTimezone: true }),
    next_review: timestamp("next_review", { withTimezone: true }),
    mastered_at: timestamp("mastered_at", { withTimezone: true }),
    status: varchar("status", {
      enum: ["active", "mastered", "suspended"],
    })
      .default("active")
      .notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
    deleted: boolean("deleted").default(false),
    source_locator: jsonb("source_locator")
      .notNull()
      .default(sql`'{}'::jsonb`),
  },
  (table) => ({
    user_idx: index("card_user_idx").on(table.user_id),
    page_idx: index("card_page_idx").on(table.page_id),
    resource_idx: index("card_resource_idx").on(table.resource_id),
    content_search_idx: index("card_content_search_idx").using(
      "gin",
      sql`to_tsvector('english', ${table.content})`,
    ),
    status_idx: index("card_status_idx").on(table.status),
    deleted_idx: index("card_deleted_idx").on(table.deleted),
  }),
);

export type CardTag = typeof cards_tags.$inferSelect;
export const cards_tags = createTable(
  "cards_tags",
  {
    card_id: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    tag_id: uuid("tag_id")
      .notNull()
      .references(() => tags.id),
    created_at: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.card_id, table.tag_id] }),
    card_idx: index("cards_tags_card_idx").on(table.card_id),
    tag_idx: index("cards_tags_tag_idx").on(table.tag_id),
  }),
);

export const pagesRelations = relations(pages, ({ many, one }) => ({
  tags: many(pages_tags),
  users: many(users_pages),
  resources: many(resourcesPages),
  folder: one(folders, {
    fields: [pages.folder_id],
    references: [folders.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  pages: many(pages_tags),
  users: many(users_tags),
}));

export const usersRelations = relations(users, ({ many }) => ({
  ownedResources: many(resources),
  resourceRelations: many(usersResources),
  pages: many(users_pages),
  tags: many(users_tags),
  images: many(images),
  tabs: many(tabs),
  folders: many(folders),
}));

export const pagesTagsRelations = relations(pages_tags, ({ one }) => ({
  page: one(pages, {
    fields: [pages_tags.page_id],
    references: [pages.id],
  }),
  tag: one(tags, {
    fields: [pages_tags.tag_id],
    references: [tags.id],
  }),
}));

export const usersPagesRelations = relations(users_pages, ({ one }) => ({
  user: one(users, {
    fields: [users_pages.user_id],
    references: [users.id],
  }),
  page: one(pages, {
    fields: [users_pages.page_id],
    references: [pages.id],
  }),
}));

export const usersTagsRelations = relations(users_tags, ({ one }) => ({
  user: one(users, {
    fields: [users_tags.user_id],
    references: [users.id],
  }),
  tag: one(tags, {
    fields: [users_tags.tag_id],
    references: [tags.id],
  }),
}));

export const resourcesRelations = relations(resources, ({ many, one }) => ({
  owner: one(users, {
    fields: [resources.owner_id],
    references: [users.id],
  }),
  userRelations: many(usersResources),
  pages: many(resourcesPages),
}));

export const usersResourcesRelations = relations(usersResources, ({ one }) => ({
  user: one(users, {
    fields: [usersResources.user_id],
    references: [users.id],
  }),
  resource: one(resources, {
    fields: [usersResources.resource_id],
    references: [resources.id],
  }),
}));

export const resourcesPagesRelations = relations(resourcesPages, ({ one }) => ({
  resource: one(resources, {
    fields: [resourcesPages.resource_id],
    references: [resources.id],
  }),
  page: one(pages, {
    fields: [resourcesPages.page_id],
    references: [pages.id],
  }),
}));

export const imagesRelations = relations(images, ({ one }) => ({
  user: one(users, {
    fields: [images.user_id],
    references: [users.id],
  }),
}));

export const tabsRelations = relations(tabs, ({ one }) => ({
  user: one(users, {
    fields: [tabs.user_id],
    references: [users.id],
  }),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
  tag: one(tags, {
    fields: [folders.tag_id],
    references: [tags.id],
  }),
  owner: one(users, {
    fields: [folders.user_id],
    references: [users.id],
  }),
  pages: many(pages),
}));

export const usersFoldersRelations = relations(users_folders, ({ one }) => ({
  user: one(users, {
    fields: [users_folders.user_id],
    references: [users.id],
  }),
  folder: one(folders, {
    fields: [users_folders.folder_id],
    references: [folders.id],
  }),
}));

export const cardsRelations = relations(cards, ({ many, one }) => ({
  tags: many(cards_tags),
  user: one(users, {
    fields: [cards.user_id],
    references: [users.id],
  }),
  page: one(pages, {
    fields: [cards.page_id],
    references: [pages.id],
  }),
  resource: one(resources, {
    fields: [cards.resource_id],
    references: [resources.id],
  }),
}));

export const cardsTagsRelations = relations(cards_tags, ({ one }) => ({
  card: one(cards, {
    fields: [cards_tags.card_id],
    references: [cards.id],
  }),
  tag: one(tags, {
    fields: [cards_tags.tag_id],
    references: [tags.id],
  }),
}));

// export type InteractiveComponent = typeof interactive_components.$inferSelect;
// export type NewInteractiveComponent =
//   typeof interactive_components.$inferInsert;

// export const interactive_components = createTable("interactive_components", {
//   id: uuid("id").defaultRandom().primaryKey(),
//   subject: varchar("subject", { length: 255 }).notNull(),
//   code: text("code").notNull(),
//   status: varchar("status", { length: 20 }).notNull().default("active"),
//   created_by: uuid("created_by")
//     .notNull()
//     .references(() => users.id, { onDelete: "cascade" }),
//   created_at: timestamp("created_at", { withTimezone: true })
//     .default(sql`CURRENT_TIMESTAMP`)
//     .notNull(),
//   updated_at: timestamp("updated_at", { withTimezone: true }).$onUpdate(
//     () => new Date(),
//   ),
//   views: integer("views").default(0).notNull(),
//   likes: integer("likes").default(0).notNull(),
// });

// =====================
// Feature Discovery Schema
// =====================

export const feature_discoveries = createTable(
  "feature_discoveries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    feature_key: text("feature_key").notNull(),
    discovered_at: timestamp("discovered_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => {
    return {
      user_feature_idx: index("user_feature_idx").on(
        table.user_id,
        table.feature_key,
      ),
    };
  },
);

export const featureDiscoveriesRelations = relations(
  feature_discoveries,
  ({ one }) => ({
    user: one(users, {
      fields: [feature_discoveries.user_id],
      references: [users.id],
    }),
  }),
);

// =====================
// Integration Schema
// =====================

export const integrationCredentials = createTable(
  "integration_credential",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id),
    provider: varchar("provider", { length: 32 }).notNull(), // 'obsidian' | 'notion' | …
    type: varchar("type", { length: 16 }).notNull(), // 'machine' | 'oauth' | 'pat'
    // One of the two branches below is **always** null
    hashed_token: varchar("hashed_token", { length: 256 }), // machine keys (stored hashed)
    access_token_enc: text("access_token_enc"), // AES-GCM encrypted blob
    refresh_token_enc: text("refresh_token_enc"), // nullable
    expires_at: timestamp("expires_at", { withTimezone: true }),
    scope: text("scope")
      .array()
      .default(sql`ARRAY[]::text[]`),
    last_used: timestamp("last_used", { withTimezone: true }),
    revoked_at: timestamp("revoked_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).default(
      sql`now()`,
    ),
  },
  (table) => {
    return {
      token_prefix_idx: index("integration_credentials_token_prefix_idx").on(
        table.hashed_token,
      ),
    };
  },
);

export const integrationCredentialsRelations = relations(
  integrationCredentials,
  ({ one }) => ({
    user: one(users, {
      fields: [integrationCredentials.user_id],
      references: [users.id],
    }),
  }),
);
