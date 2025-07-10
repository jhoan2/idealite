// src/server/actions/autoArchive.ts
"use server";

import { db } from "~/server/db";
import { pages, cards, users_pages, notifications } from "~/server/db/schema";
import { eq, and, lt, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type AutoArchiveContextData = {
  original_archived_state: boolean;
  archived_at: string;
  reason: string;
  page_title: string;
};

// Helper function to find pages eligible for archiving
export async function findPagesEligibleForArchiving() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Find pages that:
  // 1. Are not archived and not deleted
  // 2. Haven't been updated in 30+ days
  // 3. Either have no cards OR all cards are mastered/suspended
  const eligiblePages = await db
    .select({
      pageId: pages.id,
      pageTitle: pages.title,
      userId: users_pages.user_id,
      updatedAt: pages.updated_at,
      activeCardCount: sql<number>`COUNT(CASE WHEN ${cards.status} = 'active' THEN 1 END)`,
    })
    .from(pages)
    .innerJoin(users_pages, eq(users_pages.page_id, pages.id))
    .leftJoin(cards, and(eq(cards.page_id, pages.id), eq(cards.deleted, false)))
    .where(
      and(
        eq(pages.archived, false),
        eq(pages.deleted, false),
        lt(pages.updated_at, thirtyDaysAgo),
      ),
    )
    .groupBy(pages.id, pages.title, users_pages.user_id, pages.updated_at)
    .having(eq(sql`COUNT(CASE WHEN ${cards.status} = 'active' THEN 1 END)`, 0));

  return eligiblePages;
}

// Function to archive a single page
export async function archivePage(pageId: string) {
  try {
    const result = await db
      .update(pages)
      .set({
        archived: true,
        updated_at: new Date(),
      })
      .where(eq(pages.id, pageId))
      .returning({
        id: pages.id,
        title: pages.title,
      });

    return result[0];
  } catch (error) {
    console.error("Error archiving page:", error);
    throw error;
  }
}

// Function to create a notification for an archived page
export async function createArchiveNotification(
  userId: string,
  pageId: string,
  pageTitle: string,
) {
  try {
    const notification = await db
      .insert(notifications)
      .values({
        user_id: userId,
        event_type: "auto_archive",
        notification_type: "info",
        entity_type: "page",
        entity_id: pageId,
        title: `Page "${pageTitle}" was auto-archived`,
        message:
          "This page was archived because it hasn't been updated in 30+ days and has no active learning cards.",
        context_data: {
          original_archived_state: false,
          archived_at: new Date().toISOString(),
          reason: "no_active_cards_30_days",
          page_title: pageTitle,
        },
      })
      .returning();

    return notification[0];
  } catch (error) {
    console.error("Error creating archive notification:", error);
    throw error;
  }
}

// Main workflow function - this is what gets called by the scheduled job
export async function runAutoArchiveWorkflow() {
  try {
    // Find all pages eligible for archiving
    const eligiblePages = await findPagesEligibleForArchiving();

    const results = {
      processed: 0,
      archived: 0,
      notifications: 0,
      errors: 0,
    };

    // Process each page
    for (const page of eligiblePages) {
      try {
        results.processed++;

        // Archive the page
        const archivedPage = await archivePage(page.pageId);

        if (archivedPage) {
          results.archived++;

          // Create notification
          const notification = await createArchiveNotification(
            page.userId,
            page.pageId,
            page.pageTitle,
          );

          if (notification) {
            results.notifications++;
          }
        }
      } catch (error) {
        results.errors++;
        console.error(`Error processing page ${page.pageId}:`, error);
      }
    }

    return results;
  } catch (error) {
    console.error("Auto-archive workflow failed:", error);
    throw error;
  }
}

// For testing - function to manually trigger the workflow
export async function triggerAutoArchiveWorkflow() {
  return await runAutoArchiveWorkflow();
}

export async function undoPageArchive(notificationId: string) {
  try {
    // Get the notification to access context data
    const notification = await db.query.notifications.findFirst({
      where: eq(notifications.id, notificationId),
    });

    if (!notification || notification.event_type !== "auto_archive") {
      throw new Error("Invalid notification for undo");
    }

    const { entity_id: pageId, context_data } = notification;
    
    // Type assertion for context_data
    const contextData = context_data as AutoArchiveContextData;
    const originalArchivedState = contextData.original_archived_state;

    // Restore the page to its original archived state
    await db
      .update(pages)
      .set({
        archived: originalArchivedState,
        updated_at: new Date(),
      })
      .where(eq(pages.id, pageId));

    // Mark the notification as reversed
    await db
      .update(notifications)
      .set({
        status: "reversed",
        status_changed_at: new Date(),
      })
      .where(eq(notifications.id, notificationId));
      revalidatePath("/workspace");
    return { success: true };
  } catch (error) {
    console.error("Error undoing page archive:", error);
    throw error;
  }
}