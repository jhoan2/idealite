"use server";

import { and, eq, exists, inArray } from "drizzle-orm";
import { db } from "../db";
import { pages, users_pages, pages_tags, tags, users_tags } from "../db/schema";
import { revalidatePath } from "next/cache";
import { auth } from "~/app/auth";
import { z } from "zod";

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
    return await db.transaction(async (tx) => {
      const [updatedPage] = await tx
        .update(pages)
        .set({
          primary_tag_id: newTagId,
          folder_id: null,
          updated_at: new Date(),
        })
        .where(eq(pages.id, pageId))
        .returning();

      await tx
        .insert(pages_tags)
        .values({
          page_id: pageId,
          tag_id: newTagId,
        })
        .onConflictDoNothing();

      revalidatePath("/workspace");

      return {
        success: true,
        page: updatedPage,
      };
    });
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
    return { success: false, error: "Unauthorized" };
  }

  try {
    await db.transaction(async (tx) => {
      if (addedTags.length > 0) {
        for (const tag of addedTags) {
          // Check if relation exists but is archived
          const existingRelation = await tx
            .select()
            .from(users_tags)
            .where(
              and(
                eq(users_tags.user_id, userId),
                eq(users_tags.tag_id, typeof tag === "string" ? tag : tag.id),
              ),
            )
            .limit(1);

          if (existingRelation.length > 0) {
            // Update existing relation to unarchive
            await tx
              .update(users_tags)
              .set({ is_archived: false })
              .where(
                and(
                  eq(users_tags.user_id, userId),
                  eq(users_tags.tag_id, typeof tag === "string" ? tag : tag.id),
                ),
              );
          } else {
            // Create new relation
            await tx.insert(users_tags).values({
              user_id: userId,
              tag_id: typeof tag === "string" ? tag : tag.id,
              is_archived: false,
            });
          }
        }
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

    revalidatePath("/workspace");
    revalidatePath("/explore");
    return { success: true };
  } catch (error) {
    console.error("Error updating user tags:", error);
    return { success: false, error: "Failed to update user tags" };
  }
}

export async function toggleTagArchived({
  tagId,
  isArchived,
}: {
  tagId: string;
  isArchived: boolean;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  try {
    await db
      .update(users_tags)
      .set({ is_archived: isArchived })
      .where(
        and(
          eq(users_tags.tag_id, tagId),
          eq(users_tags.user_id, session.user.id),
        ),
      );

    revalidatePath("/workspace");
    revalidatePath("/explore");
    return { success: true };
  } catch (error) {
    console.error("Error toggling tag archive state:", error);
    return { success: false, error: "Failed to update archive state" };
  }
}

export async function addUserTag(tagId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await db
      .insert(users_tags)
      .values({
        user_id: session.user.id,
        tag_id: tagId,
        is_archived: false,
        is_collapsed: false,
      })
      .onConflictDoUpdate({
        target: [users_tags.user_id, users_tags.tag_id],
        set: {
          is_archived: false,
        },
      });

    revalidatePath("/workspace");
    revalidatePath("/explore");
    return { success: true };
  } catch (error) {
    console.error("Error adding tag:", error);
    return { success: false, error: "Failed to add tag" };
  }
}

const createTagForUserSchema = z.object({
  name: z.string().min(1),
  parentId: z.string().uuid().optional(),
});

type CreateTagInput = z.infer<typeof createTagForUserSchema>;

export async function createTagForUser(input: CreateTagInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate input
    const validatedInput = createTagForUserSchema.parse(input);

    return await db.transaction(async (tx) => {
      // Create the new tag
      const [newTag] = await tx
        .insert(tags)
        .values({
          name: validatedInput.name,
          parent_id: validatedInput.parentId || null,
          deleted: false,
          is_template: false,
        })
        .returning();

      if (!newTag) {
        throw new Error("Failed to create tag");
      }

      // Create the user-tag relationship
      await tx.insert(users_tags).values({
        user_id: session.user?.id ?? "",
        tag_id: newTag.id,
        is_archived: false,
        is_collapsed: false,
      });

      revalidatePath("/workspace");
      return {
        success: true,
        tag: newTag,
      };
    });
  } catch (error) {
    console.error("Error creating tag:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid input",
      };
    }
    return {
      success: false,
      error: "Failed to create tag",
    };
  }
}
