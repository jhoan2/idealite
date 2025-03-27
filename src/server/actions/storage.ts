"use server";

import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";

export async function updateStorageUsed(userId: string, sizeChange: number) {
  const user = await currentUser();

  if (!user?.externalId) {
    throw new Error("Unauthorized");
  }

  await db
    .update(users)
    .set({
      storage_used: sql`${users.storage_used} + ${sizeChange}`,
    })
    .where(eq(users.id, userId));
}
