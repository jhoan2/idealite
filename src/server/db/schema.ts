// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
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
  updated_at: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
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
    };
  },
);

export const pages_tags = createTable(
  "pages_tags",
  {
    page_id: uuid("page_id")
      .notNull()
      .references(() => pages.id),
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
      .references(() => pages.id),
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
