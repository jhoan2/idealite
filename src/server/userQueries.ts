import "server-only";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

type SelectUser = typeof users.$inferSelect;
type InsertUser = typeof users.$inferInsert;

export async function findUserByFid(fid: number): Promise<SelectUser | null> {
  const result = await db.select().from(users).where(eq(users.fid, fid)).limit(1);
  return result[0] || null;
}

export async function createUser(userData: InsertUser): Promise<SelectUser> {
  const result = await db.insert(users).values(userData).returning();
  return result[0]!;
}
