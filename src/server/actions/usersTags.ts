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
        })
        .returning();

      if (!newPage) {
        throw new Error("Failed to create page");
      }

      // 2. Create the page-tag relationship
      await tx.insert(pages_tags).values({
        page_id: newPage.id,
        tag_id: input.tag_id,
      });

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

    revalidatePath("/projects");
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

      revalidatePath("/projects");
      return { success: true };
    });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return { success: false, error: "Failed to delete tag" };
  }
}

const movePagesSchema = z.object({
  pageIds: z.array(z.string().uuid()),
  sourceTagId: z.string().uuid(),
  destinationTagId: z.string().uuid(),
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
    const { pageIds, sourceTagId, destinationTagId } = validatedInput;

    return await db.transaction(async (tx) => {
      // Verify user has access to both tags
      const userTagsCount = await tx
        .select({ count: sql<number>`count(*)` })
        .from(users_tags)
        .where(
          and(
            eq(users_tags.user_id, session.user?.id ?? ""),
            inArray(users_tags.tag_id, [sourceTagId, destinationTagId]),
          ),
        );

      if (Number(userTagsCount[0]?.count) !== 2) {
        throw new Error("User doesn't have access to both tags");
      }

      // Verify user owns all the pages being moved
      const userPagesCount = await tx
        .select({ count: sql<number>`count(*)` })
        .from(users_pages)
        .where(
          and(
            eq(users_pages.user_id, session.user?.id ?? ""),
            eq(users_pages.role, "owner"),
            inArray(users_pages.page_id, pageIds),
          ),
        );

      if (Number(userPagesCount[0]?.count) !== pageIds.length) {
        throw new Error("User doesn't own all the specified pages");
      }

      // Delete existing relationships with source tag
      await tx.delete(pages_tags).where(
        and(
          eq(pages_tags.tag_id, sourceTagId),
          inArray(pages_tags.page_id, pageIds),
          // Additional check to ensure we only modify user's own pages
          exists(
            tx
              .select()
              .from(users_pages)
              .where(
                and(
                  eq(users_pages.user_id, session.user?.id ?? ""),
                  eq(users_pages.page_id, pages_tags.page_id),
                  eq(users_pages.role, "owner"),
                ),
              ),
          ),
        ),
      );

      // Create new relationships with destination tag
      const newRelations = pageIds.map((pageId) => ({
        page_id: pageId,
        tag_id: destinationTagId,
        created_at: new Date(),
      }));

      await tx.insert(pages_tags).values(newRelations);

      // Revalidate paths
      revalidatePath("/projects");

      return {
        success: true,
        data: {
          movedPages: pageIds.length,
          sourceTag: sourceTagId,
          destinationTag: destinationTagId,
        },
      };
    });
  } catch (error) {
    console.error("Error moving pages between tags:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid input format",
        details: error.errors,
      };
    }
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: "Failed to move pages between tags",
    };
  }
}
