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
      name_idx: index("name_idx").on(table.name),
      created_at_idx: index("created_at_idx").on(table.created_at),
      deleted_idx: index("deleted_idx").on(table.deleted),
    };
  },
);
