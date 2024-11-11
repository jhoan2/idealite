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
  fid: integer("fid"),
  custody_address: varchar("custody_address", { length: 256 }),
  username: varchar("username", { length: 256 }),
  display_name: varchar("display_name", { length: 256 }),
  pfp_url: varchar("pfp_url", { length: 256 }),
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

export const tags = createTable(
  "tag",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name")
      .notNull()
      .unique()
      .$default(() => sql`lower(name)`),
    parent_id: uuid("parent_id").references((): AnyPgColumn => tags.id),
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

export const pages = createTable(
  "page",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title")
      .notNull()
      .$default(() => sql`lower(title)`),
    content: text("content"),
    primary_tag_id: uuid("primary_tag_id"),
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

export const pagesRelations = relations(pages, ({ many }) => ({
  tags: many(pages_tags),
  users: many(users_pages),
  resources: many(resourcesPages),
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
