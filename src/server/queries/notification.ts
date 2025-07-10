// src/server/queries/notification.ts
"use server";

import { db } from "~/server/db";
import { notifications } from "~/server/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, and, desc, count } from "drizzle-orm";

export type Notification = typeof notifications.$inferSelect;

export async function getUserNotifications(limit: number = 20) {
  const user = await currentUser();
  if (!user?.externalId) {
    throw new Error("Unauthorized");
  }

  const userNotifications = await db.query.notifications.findMany({
    where: eq(notifications.user_id, user.externalId),
    orderBy: desc(notifications.created_at),
    limit,
  });

  return userNotifications;
}

export async function getUnreadNotifications() {
  const user = await currentUser();
  if (!user?.externalId) {
    throw new Error("Unauthorized");
  }

  const unreadNotifications = await db.query.notifications.findMany({
    where: and(
      eq(notifications.user_id, user.externalId),
      eq(notifications.status, "unread"),
    ),
    orderBy: desc(notifications.created_at),
  });

  return unreadNotifications;
}

export async function getNotificationCounts() {
  const user = await currentUser();
  if (!user?.externalId) {
    throw new Error("Unauthorized");
  }

  const result = await db
    .select({
      status: notifications.status,
      count: count(),
    })
    .from(notifications)
    .where(eq(notifications.user_id, user.externalId))
    .groupBy(notifications.status);

  // Transform to object for easier access
  const counts = {
    unread: 0,
    read: 0,
    reversed: 0,
    expired: 0,
  };

  result.forEach((row) => {
    counts[row.status] = row.count;
  });

  return counts;
}
