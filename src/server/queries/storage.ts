"use server";

import { db } from "~/server/db";
import { images, users } from "~/server/db/schema";
import { eq, sql } from "drizzle-orm";

export async function checkStorageLimit(
  userId: string,
  fileSize: number,
): Promise<boolean> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const user = result[0];

  if (!user) {
    throw new Error("User not found");
  }

  return user.storage_used + fileSize <= user.storage_limit;
}

export async function getStorageStats(userId: string) {
  const result = await db
    .select({
      storageUsed: users.storage_used,
      storageLimit: users.storage_limit,
      imageCount: sql<number>`count(${images.id})`,
    })
    .from(users)
    .leftJoin(images, eq(images.user_id, users.id))
    .where(eq(users.id, userId))
    .groupBy(users.id)
    .limit(1);

  const stats = result[0];

  if (!stats) {
    throw new Error("User not found");
  }

  return {
    used: stats.storageUsed,
    total: stats.storageLimit,
    available: stats.storageLimit - stats.storageUsed,
    imageCount: Number(stats.imageCount),
    usedPercentage: (stats.storageUsed / stats.storageLimit) * 100,
  };
}
