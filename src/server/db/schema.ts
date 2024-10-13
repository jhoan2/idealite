// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import {
  index,
  pgTableCreator,
  serial,
  timestamp,
  varchar,
  uuid,
  integer,
  text
} from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `idealite_${name}`);

export const users = createTable(
	"user",
  {
		id: uuid("id").primaryKey().defaultRandom(),
		fid: integer("fid"),
    custody_address: varchar("custody_address", { length: 256 }),
    username: varchar("username", { length: 256 }),
    display_name: varchar("display_name", { length: 256 }),
    pfp_url: varchar("pfp_url", { length: 256 }),
    bio: text("bio"),
		role: varchar("role", { length: 50 }).default("user").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
);

