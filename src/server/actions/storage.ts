"use server";

import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { auth } from "~/app/auth";

export async function updateStorageUsed(userId: string, sizeChange: number) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await db
    .update(users)
    .set({
      storage_used: sql`${users.storage_used} + ${sizeChange}`,
    })
    .where(eq(users.id, userId));
}
