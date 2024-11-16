"use server";

import { and, eq, exists, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import { pages, users_pages, pages_tags, tags, users_tags } from "../db/schema";
import { revalidatePath } from "next/cache";
import { auth } from "~/app/auth";
import { z } from "zod";

export type CreatePageInput = {
  title: string;
  tag_id: string;
  hierarchy: string[];
};

export async function createPage(input: CreatePageInput) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Start a transaction since we need to insert into multiple tables
    return await db.transaction(async (tx) => {
      // 1. Create the page
      const [newPage] = await tx
        .insert(pages)
        .values({
          title: input.title,
          content: "",
          primary_tag_id: input.tag_id,
        })
        .returning();

      if (!newPage) {
        throw new Error("Failed to create page");
      }

      // 2. Create the page-tag relationship
      await tx.insert(pages_tags).values(
        input.hierarchy.map((tagId) => ({
          page_id: newPage.id,
          tag_id: tagId,
        })),
      );

      // 3. Create the user-page relationship (as owner)
      await tx.insert(users_pages).values({
        user_id: session.user?.id ?? "",
        page_id: newPage.id,
        role: "owner",
      });

      // 4. Fetch the complete page data with its relationships
      const pageWithRelations = await tx.query.pages.findFirst({
        where: eq(pages.id, newPage.id),
        with: {
          tags: true,
        },
      });

      revalidatePath("/tags");

      return {
        success: true,
        data: pageWithRelations,
      };
    });
  } catch (error) {
    console.error("Failed to create page:", error);
    return {
      success: false,
      error: "Failed to create page",
    };
  }
}

const deletePageSchema = z.object({
  id: z.string().uuid(),
});

export async function deletePage(input: z.infer<typeof deletePageSchema>) {
  try {
    // Validate input
    const validatedInput = deletePageSchema.parse(input);

    await db
      .update(pages)
      .set({
        deleted: true,
        updated_at: new Date(),
      })
      .where(eq(pages.id, validatedInput.id));

    revalidatePath("/workspace");
    return { success: true };
  } catch (error) {
    console.error("Error deleting page:", error);
    return { success: false, error: "Failed to delete page" };
  }
}

export async function deleteTag({ id }: { id: string }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Start a transaction to ensure all operations complete or none do
    return await db.transaction(async (tx) => {
      // Delete only this user's relationship with the tag
      await tx
        .delete(users_tags)
        .where(
          and(
            eq(users_tags.tag_id, id),
            eq(users_tags.user_id, session.user?.id ?? ""),
          ),
        );

      // Delete this user's pages' relationships with the tag
      await tx.delete(pages_tags).where(
        and(
          eq(pages_tags.tag_id, id),
          // Only delete page_tags where the page belongs to this user
          exists(
            tx
              .select()
              .from(users_pages)
              .where(
                and(
                  eq(users_pages.page_id, pages_tags.page_id),
                  eq(users_pages.user_id, session.user?.id ?? ""),
                ),
              ),
          ),
        ),
      );

      revalidatePath("/workspace");
      return { success: true };
    });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return { success: false, error: "Failed to delete tag" };
  }
}

const movePagesSchema = z.object({
  pageId: z.string().uuid(),
  newTagId: z.string().uuid(),
});

type MovePagesInput = z.infer<typeof movePagesSchema>;

export async function movePagesBetweenTags(input: MovePagesInput) {
  try {
    const session = await auth();

    // Check authentication
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Validate input
    const validatedInput = movePagesSchema.parse(input);
    const { pageId, newTagId } = validatedInput;
    // 1. Validate user has access to the page
    const pageAccess = await db
      .select({ id: pages.id })
      .from(pages)
      .innerJoin(users_pages, eq(users_pages.page_id, pages.id))
      .where(
        and(
          eq(pages.id, pageId),
          eq(users_pages.user_id, session.user?.id ?? ""),
          eq(pages.deleted, false),
        ),
      )
      .limit(1);

    if (!pageAccess.length) {
      return { success: false, error: "Page not found or no access" };
    }

    // 2. Validate user has access to the new tag
    const tagAccess = await db
      .select({ id: tags.id })
      .from(tags)
      .innerJoin(users_tags, eq(users_tags.tag_id, tags.id))
      .where(
        and(
          eq(tags.id, newTagId),
          eq(users_tags.user_id, session.user?.id ?? ""),
          eq(tags.deleted, false),
        ),
      )
      .limit(1);

    if (!tagAccess.length) {
      return { success: false, error: "Tag not found or no access" };
    }

    // 3. Update the page's tag_id
    const [updatedPage] = await db
      .update(pages)
      .set({
        primary_tag_id: newTagId,
        updated_at: new Date(),
      })
      .where(eq(pages.id, pageId))
      .returning();

    revalidatePath("/workspace");
    return {
      success: true,
      page: updatedPage,
    };
  } catch (error) {
    console.error("Error moving page:", error);
    return { success: false, error: "Failed to move page" };
  }
}

export async function updateTagCollapsed({
  tagId,
  isCollapsed,
}: {
  tagId: string;
  isCollapsed: boolean;
}) {
  const session = await auth();
  try {
    await db
      .update(users_tags)
      .set({ is_collapsed: isCollapsed })
      .where(
        and(
          eq(users_tags.tag_id, tagId),
          eq(users_tags.user_id, session?.user?.id ?? ""),
        ),
      );

    return { success: true };
  } catch (error) {
    console.error("Error updating tag collapsed state:", error);
    return { success: false, error: "Failed to update tag state" };
  }
}

export async function updateUserTags({
  userId,
  addedTags,
  removedTags,
}: {
  userId: string;
  addedTags: { id: string }[];
  removedTags: { id: string }[];
}) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  try {
    await db.transaction(async (tx) => {
      if (addedTags.length > 0) {
        await tx.insert(users_tags).values(
          addedTags.map((tag) => ({
            user_id: userId,
            tag_id: typeof tag === "string" ? tag : tag.id,
          })),
        );
      }

      if (removedTags.length > 0) {
        await tx.delete(users_tags).where(
          and(
            eq(users_tags.user_id, userId),
            inArray(
              users_tags.tag_id,
              removedTags.map((tag) =>
                typeof tag === "string" ? tag : tag.id,
              ),
            ),
          ),
        );
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating user tags:", error);
    return { success: false, error: "Failed to update user tags" };
  }
}
