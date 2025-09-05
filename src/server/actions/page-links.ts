"use server";

import { db } from "~/server/db";
import { pages_edges, users_pages } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { validatePageId } from "~/lib/editor/link-extraction";
import * as Sentry from "@sentry/nextjs";

export async function updatePageLinks(
  sourcePageId: string,
  targetPageIds: string[],
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      throw new Error("Unauthorized");
    }

    // Validate source page ID
    if (!validatePageId(sourcePageId)) {
      throw new Error("Invalid source page ID");
    }

    // Verify user has access to the source page
    const userPage = await db.query.users_pages.findFirst({
      where: and(
        eq(users_pages.page_id, sourcePageId),
        eq(users_pages.user_id, user.externalId),
      ),
    });

    if (!userPage) {
      throw new Error("Source page not found or unauthorized");
    }

    // Filter out invalid target page IDs and duplicates
    const validTargetIds = Array.from(
      new Set(targetPageIds.filter((id) => validatePageId(id) && id !== sourcePageId))
    );

    // Verify user has access to all target pages
    if (validTargetIds.length > 0) {
      const accessibleTargetIds = new Set<string>();
      for (const targetId of validTargetIds) {
        const hasAccess = await db.query.users_pages.findFirst({
          where: and(
            eq(users_pages.page_id, targetId),
            eq(users_pages.user_id, user.externalId),
          ),
        });
        if (hasAccess) {
          accessibleTargetIds.add(targetId);
        }
      }

      return await db.transaction(async (tx) => {
        // Delete existing outgoing links from this page
        await tx
          .delete(pages_edges)
          .where(eq(pages_edges.source_page_id, sourcePageId));

        // Insert new links (only for pages user has access to)
        if (accessibleTargetIds.size > 0) {
          const edgeData = Array.from(accessibleTargetIds).map((targetId) => ({
            source_page_id: sourcePageId,
            target_page_id: targetId,
          }));

          await tx
            .insert(pages_edges)
            .values(edgeData)
            .onConflictDoNothing();
        }

        return { success: true };
      });
    } else {
      // No valid target IDs, just remove existing links
      await db
        .delete(pages_edges)
        .where(eq(pages_edges.source_page_id, sourcePageId));

      return { success: true };
    }
  } catch (error) {
    console.error("Error updating page links:", error);
    
    Sentry.captureException(error, {
      tags: {
        operation: "update_page_links",
        component: "page_links_action",
      },
      extra: {
        sourcePageId,
        targetPageIds,
        userId: await currentUser().then(u => u?.externalId),
      },
      level: "error",
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update page links",
    };
  }
}

export async function getPageOutgoingLinks(pageId: string): Promise<{
  success: boolean;
  links?: Array<{ id: string; title: string }>;
  error?: string;
}> {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      throw new Error("Unauthorized");
    }

    // Verify user has access to the page
    const userPage = await db.query.users_pages.findFirst({
      where: and(
        eq(users_pages.page_id, pageId),
        eq(users_pages.user_id, user.externalId),
      ),
    });

    if (!userPage) {
      throw new Error("Page not found or unauthorized");
    }

    const links = await db.query.pages_edges.findMany({
      where: eq(pages_edges.source_page_id, pageId),
      with: {
        targetPage: {
          columns: {
            id: true,
            title: true,
          },
        },
      },
    });

    return {
      success: true,
      links: links.map((link) => ({
        id: link.targetPage.id,
        title: link.targetPage.title,
      })),
    };
  } catch (error) {
    console.error("Error getting page outgoing links:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get page links",
    };
  }
}

