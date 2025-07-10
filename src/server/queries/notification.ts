// src/server/queries/notification.ts
"use server";

import { db } from "~/server/db";
import { notifications } from "~/server/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, and, desc, count, lt, inArray } from "drizzle-orm";

export type Notification = typeof notifications.$inferSelect;

export type PaginatedNotifications = {
  data: Notification[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
    totalCount: number;
  };
};

export async function getUserNotificationsPaginated(
  limit: number = 10,
  cursor?: string, // ISO timestamp of last notification
): Promise<PaginatedNotifications> {
  const user = await currentUser();
  if (!user?.externalId) {
    throw new Error("Unauthorized");
  }

  // Build where conditions
  const whereConditions = [eq(notifications.user_id, user.externalId)];

  // Add cursor condition if provided
  if (cursor) {
    whereConditions.push(lt(notifications.created_at, new Date(cursor)));
  }

  // Fetch notifications with limit + 1 to check if there are more
  const userNotifications = await db.query.notifications.findMany({
    where: and(...whereConditions),
    orderBy: desc(notifications.created_at),
    limit: limit + 1, // Fetch one extra to determine hasMore
  });

  // Check if there are more notifications
  const hasMore = userNotifications.length > limit;
  const data = hasMore ? userNotifications.slice(0, limit) : userNotifications;

  // Get total count for the user
  const [totalCountResult] = await db
    .select({ count: count() })
    .from(notifications)
    .where(eq(notifications.user_id, user.externalId));

  const totalCount = totalCountResult?.count || 0;

  // Set next cursor to the created_at of the last item
  const nextCursor =
    data.length > 0 ? data[data.length - 1]!.created_at.toISOString() : null;

  return {
    data,
    pagination: {
      hasMore,
      nextCursor: hasMore ? nextCursor : null,
      totalCount,
    },
  };
}

// Get notifications with status filter and pagination
export async function getNotificationsByStatus(
  status: "unread" | "read" | "reversed" | "expired",
  limit: number = 10,
  cursor?: string,
): Promise<PaginatedNotifications> {
  const user = await currentUser();
  if (!user?.externalId) {
    throw new Error("Unauthorized");
  }

  const whereConditions = [
    eq(notifications.user_id, user.externalId),
    eq(notifications.status, status),
  ];

  if (cursor) {
    whereConditions.push(lt(notifications.created_at, new Date(cursor)));
  }

  const userNotifications = await db.query.notifications.findMany({
    where: and(...whereConditions),
    orderBy: desc(notifications.created_at),
    limit: limit + 1,
  });

  const hasMore = userNotifications.length > limit;
  const data = hasMore ? userNotifications.slice(0, limit) : userNotifications;

  // Get total count for this status
  const [totalCountResult] = await db
    .select({ count: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.user_id, user.externalId),
        eq(notifications.status, status),
      ),
    );

  const totalCount = totalCountResult?.count || 0;
  const nextCursor =
    data.length > 0 ? data[data.length - 1]!.created_at.toISOString() : null;

  return {
    data,
    pagination: {
      hasMore,
      nextCursor: hasMore ? nextCursor : null,
      totalCount,
    },
  };
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

// Batch mark notifications as read
export async function markMultipleNotificationsAsRead(notificationIds: string[]) {
  const user = await currentUser();
  if (!user?.externalId) {
    throw new Error("Unauthorized");
  }

  if (notificationIds.length === 0) return;

  await db
    .update(notifications)
    .set({ status: "read" })
    .where(
      and(
        inArray(notifications.id, notificationIds),
        eq(notifications.user_id, user.externalId),
        eq(notifications.status, "unread") // Only update unread notifications
      )
    );
}