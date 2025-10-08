// src/server/actions/pinnedPages.ts
"use server";

import { db } from "~/server/db";
import { users_pages } from "~/server/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq, gt, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const pinPageSchema = z.object({
  pageId: z.string().uuid(),
});

export async function pinPage(input: z.infer<typeof pinPageSchema>) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return { success: false, error: "Unauthorized" };
    }

    const { pageId } = pinPageSchema.parse(input);

    // Check if user has access to this page
    const userPage = await db.query.users_pages.findFirst({
      where: and(
        eq(users_pages.user_id, user.externalId),
        eq(users_pages.page_id, pageId),
      ),
    });

    if (!userPage) {
      return { success: false, error: "Page not found or no access" };
    }

    if (userPage.is_pinned) {
      return { success: false, error: "Page is already pinned" };
    }

    // Get the next position (max position + 1)
    const maxPositionResult = await db
      .select({
        maxPosition: sql<number>`COALESCE(MAX(${users_pages.pin_position}), 0)`,
      })
      .from(users_pages)
      .where(
        and(
          eq(users_pages.user_id, user.externalId),
          eq(users_pages.is_pinned, true),
        ),
      );

    const nextPosition = (maxPositionResult[0]?.maxPosition || 0) + 1;

    // Pin the page
    await db
      .update(users_pages)
      .set({
        is_pinned: true,
        pin_position: nextPosition,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(users_pages.user_id, user.externalId),
          eq(users_pages.page_id, pageId),
        ),
      );

    revalidatePath("/workspace");
    return { success: true };
  } catch (error) {
    console.error("Error pinning page:", error);
    return { success: false, error: "Failed to pin page" };
  }
}

export async function unpinPage(input: z.infer<typeof pinPageSchema>) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return { success: false, error: "Unauthorized" };
    }

    const { pageId } = pinPageSchema.parse(input);

    // Get the current pin position before unpinning
    const userPage = await db.query.users_pages.findFirst({
      where: and(
        eq(users_pages.user_id, user.externalId),
        eq(users_pages.page_id, pageId),
      ),
    });

    if (!userPage || !userPage.is_pinned) {
      return { success: false, error: "Page is not pinned" };
    }

    const currentPosition = userPage.pin_position;

    // Unpin the page
    await db
      .update(users_pages)
      .set({
        is_pinned: false,
        pin_position: null,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(users_pages.user_id, user.externalId),
          eq(users_pages.page_id, pageId),
        ),
      );

    // Shift down other pinned pages that were after this one
    if (currentPosition) {
      await db
        .update(users_pages)
        .set({
          pin_position: sql`${users_pages.pin_position} - 1`,
          updated_at: new Date(),
        })
        .where(
          and(
            eq(users_pages.user_id, user.externalId),
            eq(users_pages.is_pinned, true),
            gt(users_pages.pin_position, currentPosition),
          ),
        );
    }

    revalidatePath("/workspace");
    return { success: true };
  } catch (error) {
    console.error("Error unpinning page:", error);
    return { success: false, error: "Failed to unpin page" };
  }
}

const reorderPinnedPagesSchema = z.object({
  pageIds: z.array(z.string().uuid()),
});

export async function reorderPinnedPages(
  input: z.infer<typeof reorderPinnedPagesSchema>,
) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return { success: false, error: "Unauthorized" };
    }
    const userId = user.externalId;
    const { pageIds } = reorderPinnedPagesSchema.parse(input);

    // Update positions in a transaction
    await db.transaction(async (tx) => {
      for (let i = 0; i < pageIds.length; i++) {
        await tx
          .update(users_pages)
          .set({
            pin_position: i + 1,
            updated_at: new Date(),
          })
          .where(
            and(
              eq(users_pages.user_id, userId),
              eq(users_pages.page_id, pageIds[i]!),
              eq(users_pages.is_pinned, true),
            ),
          );
      }
    });

    revalidatePath("/workspace");
    return { success: true };
  } catch (error) {
    console.error("Error reordering pinned pages:", error);
    return { success: false, error: "Failed to reorder pinned pages" };
  }
}
