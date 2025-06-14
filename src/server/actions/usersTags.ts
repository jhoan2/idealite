"use server";

import { and, eq, exists, inArray } from "drizzle-orm";
import { db } from "../db";
import {
  pages,
  users_pages,
  pages_tags,
  tags,
  users_tags,
  cards_tags,
  folders,
  users,
} from "../db/schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { currentUser } from "@clerk/nextjs/server";
import { generateTagEmbedding } from "~/lib/embeddings/generateEmbedding";
import * as Sentry from "@sentry/nextjs";

export async function deleteTag({ id }: { id: string }) {
  try {
    const user = await currentUser();
    const userId = user?.externalId;
    if (!userId) {
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
        .where(and(eq(users_tags.tag_id, id), eq(users_tags.user_id, userId)));

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
                  eq(users_pages.user_id, userId),
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
    const user = await currentUser();
    const userId = user?.externalId;

    // Check authentication
    if (!userId) {
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
          eq(users_pages.user_id, userId),
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
          eq(users_tags.user_id, userId),
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
  try {
    const user = await currentUser();
    const userId = user?.externalId;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    await db
      .update(users_tags)
      .set({ is_collapsed: isCollapsed })
      .where(and(eq(users_tags.tag_id, tagId), eq(users_tags.user_id, userId)));

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
  const user = await currentUser();
  if (!user) {
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
  const user = await currentUser();
  const userId = user?.externalId;

  if (!userId) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  try {
    await db
      .update(users_tags)
      .set({ is_archived: isArchived })
      .where(and(eq(users_tags.tag_id, tagId), eq(users_tags.user_id, userId)));

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
    const user = await currentUser();
    const userId = user?.externalId;

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Use a transaction to handle both tag addition and onboarding update
    await db.transaction(async (tx) => {
      // Add the tag relationship
      await tx
        .insert(users_tags)
        .values({
          user_id: userId,
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

      // Check if user needs onboarding and update if necessary
      const userRecord = await tx
        .select({ is_onboarded: users.is_onboarded })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      // If user exists and is not onboarded, mark them as onboarded
      if (userRecord[0] && !userRecord[0].is_onboarded) {
        await tx
          .update(users)
          .set({ is_onboarded: true })
          .where(eq(users.id, userId));
      }
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
    const user = await currentUser();
    const userId = user?.externalId;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate input
    const validatedInput = createTagForUserSchema.parse(input);

    let embedding = null;
    try {
      embedding = await generateTagEmbedding(validatedInput.name);
    } catch (error) {
      console.error("Error generating embedding:", error);

      Sentry.captureException(error, {
        extra: {
          tagName: validatedInput.name,
          operation: "createTagForUser",
          userId,
        },
        tags: {
          feature: "tag_embedding",
          source: "tag_creation",
        },
      });
    }

    return await db.transaction(async (tx) => {
      // Create the new tag
      const [newTag] = await tx
        .insert(tags)
        .values({
          name: validatedInput.name,
          parent_id: validatedInput.parentId || null,
          embedding: embedding,
          deleted: false,
          is_template: false,
        })
        .returning();

      if (!newTag) {
        throw new Error("Failed to create tag");
      }

      // Create the user-tag relationship
      await tx.insert(users_tags).values({
        user_id: userId,
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

export async function changeTagRelations({
  sourceTagId,
  targetTagId,
}: {
  sourceTagId: string;
  targetTagId: string;
}): Promise<{ success: boolean; error?: string }> {
  const user = await currentUser();
  const userId = user?.externalId;

  if (userId !== process.env.ADMIN_USER_ID) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Validate inputs
    if (sourceTagId === targetTagId) {
      return {
        success: false,
        error: "Source and target tags cannot be the same",
      };
    }

    return await db.transaction(async (tx) => {
      // Verify both tags exist and source isn't already deleted
      const [sourceTag, targetTag] = await Promise.all([
        tx.query.tags.findFirst({
          where: and(eq(tags.id, sourceTagId), eq(tags.deleted, false)),
        }),
        tx.query.tags.findFirst({
          where: eq(tags.id, targetTagId),
        }),
      ]);

      if (!sourceTag) {
        return {
          success: false,
          error: "Source tag not found or already deleted",
        };
      }

      if (!targetTag) {
        return { success: false, error: "Target tag not found" };
      }

      // First, handle folder transfers since they have direct tag references
      // Get all folders for the source tag
      const sourceFolders = await tx
        .select()
        .from(folders)
        .where(eq(folders.tag_id, sourceTagId));

      // For each folder, we need to:
      // 1. Check for name conflicts in the target tag
      // 2. Update the folder's tag_id
      for (const folder of sourceFolders) {
        // Check for name conflicts
        const existingFolder = await tx
          .select()
          .from(folders)
          .where(
            and(eq(folders.tag_id, targetTagId), eq(folders.name, folder.name)),
          )
          .limit(1);

        if (existingFolder.length > 0) {
          // If there's a conflict, append a number to the name
          let counter = 1;
          let newName = `${folder.name} (${counter})`;
          while (
            await tx
              .select()
              .from(folders)
              .where(
                and(eq(folders.tag_id, targetTagId), eq(folders.name, newName)),
              )
              .limit(1)
              .then((rows) => rows.length > 0)
          ) {
            counter++;
            newName = `${folder.name} (${counter})`;
          }

          // Update folder with new name and tag
          await tx
            .update(folders)
            .set({
              name: newName,
              tag_id: targetTagId,
              updated_at: new Date(),
            })
            .where(eq(folders.id, folder.id));
        } else {
          // No conflict, just update the tag
          await tx
            .update(folders)
            .set({
              tag_id: targetTagId,
              updated_at: new Date(),
            })
            .where(eq(folders.id, folder.id));
        }
      }

      // Transfer user-tag relations
      const userTagRelations = await tx
        .select()
        .from(users_tags)
        .where(eq(users_tags.tag_id, sourceTagId));

      if (userTagRelations.length > 0) {
        await tx
          .insert(users_tags)
          .values(
            userTagRelations.map((relation) => ({
              user_id: relation.user_id,
              tag_id: targetTagId,
              is_collapsed: relation.is_collapsed,
              is_archived: relation.is_archived,
            })),
          )
          .onConflictDoNothing();
      }

      // Transfer page-tag relations
      const pageTagRelations = await tx
        .select()
        .from(pages_tags)
        .where(eq(pages_tags.tag_id, sourceTagId));

      if (pageTagRelations.length > 0) {
        await tx
          .insert(pages_tags)
          .values(
            pageTagRelations.map((relation) => ({
              page_id: relation.page_id,
              tag_id: targetTagId,
            })),
          )
          .onConflictDoNothing();
      }

      // Transfer card-tag relations
      const cardTagRelations = await tx
        .select()
        .from(cards_tags)
        .where(eq(cards_tags.tag_id, sourceTagId));

      if (cardTagRelations.length > 0) {
        await tx
          .insert(cards_tags)
          .values(
            cardTagRelations.map((relation) => ({
              card_id: relation.card_id,
              tag_id: targetTagId,
            })),
          )
          .onConflictDoNothing();
      }

      // Update pages where this was the primary tag
      await tx
        .update(pages)
        .set({
          primary_tag_id: targetTagId,
          updated_at: new Date(),
        })
        .where(eq(pages.primary_tag_id, sourceTagId));

      // Update child tags to point to the new parent
      await tx
        .update(tags)
        .set({
          parent_id: targetTagId,
          updated_at: new Date(),
        })
        .where(and(eq(tags.parent_id, sourceTagId), eq(tags.deleted, false)));

      // Mark the source tag as deleted
      await tx
        .update(tags)
        .set({
          deleted: true,
          updated_at: new Date(),
        })
        .where(eq(tags.id, sourceTagId));

      revalidatePath("/workspace");
      revalidatePath("/explore");

      return { success: true };
    });
  } catch (error) {
    console.error("Error changing tag relations:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to change tag relations",
    };
  }
}
