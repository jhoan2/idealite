"use server";

import { db } from "~/server/db";
import { pages, pages_tags, users_pages } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "~/app/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";

type Page = typeof pages.$inferSelect;
type PageInsert = typeof pages.$inferInsert;

const updatePageSchema = z.object({
  pageId: z.string().uuid(),
  updateData: z.object({
    title: z.string().optional(),
    content: z.string().optional(),
  }),
});

export async function updatePage(
  pageId: string,
  updateData: Partial<PageInsert>,
): Promise<Page> {
  try {
    // Validate input
    const { pageId: validatedPageId, updateData: validatedUpdateData } =
      updatePageSchema.parse({ pageId, updateData });

    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Check if the user has access to the page
    const userPage = await db.query.users_pages.findFirst({
      where: and(
        eq(users_pages.user_id, session.user.id),
        eq(users_pages.page_id, validatedPageId),
      ),
    });

    if (!userPage) {
      throw new Error("Page not found or user doesn't have access");
    }

    const updatedPage = await db
      .update(pages)
      .set({
        ...validatedUpdateData,
        updated_at: new Date(),
      })
      .where(eq(pages.id, validatedPageId))
      .returning();

    if (updatedPage.length === 0 || !updatedPage[0]) {
      throw new Error("Failed to update page");
    }

    revalidatePath(`/projects`);

    return updatedPage[0];
  } catch (error) {
    console.error("Error updating page:", error);
    throw error;
  }
}

const addTagToPageSchema = z.object({
  pageId: z.string().uuid(),
  tagId: z.string().uuid(),
});

export async function addTagToPage(pageId: string, tagId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  try {
    const { pageId: validatedPageId, tagId: validatedTagId } =
      addTagToPageSchema.parse({ pageId, tagId });

    await db.insert(pages_tags).values({
      page_id: validatedPageId,
      tag_id: validatedTagId,
    });

    return { success: true };
  } catch (error) {
    console.error("Error adding tag:", error);
    return { error: "Failed to add tag" };
  }
}

const removeTagFromPageSchema = z.object({
  pageId: z.string().uuid(),
  tagId: z.string().uuid(),
});

export async function removeTagFromPage(pageId: string, tagId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const { pageId: validatedPageId, tagId: validatedTagId } =
      removeTagFromPageSchema.parse({ pageId, tagId });

    await db
      .delete(pages_tags)
      .where(
        and(
          eq(pages_tags.page_id, validatedPageId),
          eq(pages_tags.tag_id, validatedTagId),
        ),
      );

    return { success: true };
  } catch (error) {
    console.error("Error removing tag:", error);
    return { error: "Failed to remove tag" };
  }
}
