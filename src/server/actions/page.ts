// src/server/actions/page.ts
"use server";

import { db } from "~/server/db";
import {
  pages,
  pages_tags,
  resourcesPages,
  users_folders,
  users_pages,
  folders,
  users_tags,
} from "~/server/db/schema";
import { eq, and, exists, or, sql } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { movePagesBetweenTags } from "./usersTags";
import { currentUser } from "@clerk/nextjs/server";
import {
  extractPageMetadata,
  hasContentChangedSignificantly,
} from "~/lib/editor/content-parse";
import { extractLinksFromTipTapJSON } from "~/lib/editor/link-extraction";
import { updatePageLinks } from "~/server/actions/page-links";
import * as Sentry from "@sentry/nextjs";
import { updatePageNodeHashes, hasSignificantNodeChanges } from "./node-hashes";
import { generatePageEmbeddingsWithContext } from "./embeddings";

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

    const user = await currentUser();

    if (!user?.externalId) {
      throw new Error("Unauthorized");
    }

    // Check if the user has access to the page
    const userPage = await db.query.users_pages.findFirst({
      where: and(
        eq(users_pages.user_id, user.externalId),
        eq(users_pages.page_id, validatedPageId),
      ),
    });

    if (!userPage) {
      throw new Error("Page not found or user doesn't have access");
    }

    // If updating title, ensure uniqueness across user's pages
    if (validatedUpdateData.title) {
      // Get all existing page titles for this user
      const existingPages = await db
        .select({ title: pages.title })
        .from(pages)
        .innerJoin(users_pages, eq(users_pages.page_id, pages.id))
        .where(
          and(
            eq(users_pages.user_id, user.externalId),
            eq(pages.deleted, false),
            sql`${pages.id} != ${validatedPageId}`, // Exclude current page
          ),
        );

      let newTitle = validatedUpdateData.title;
      let counter = 2;
      const baseTitle = validatedUpdateData.title;

      // Check if title already exists and auto-rename if needed
      while (
        existingPages.some(
          (page) => page.title?.toLowerCase() === newTitle.toLowerCase(),
        )
      ) {
        newTitle = `${baseTitle} (${counter})`;
        counter++;
      }

      // Update the validated data with the unique title
      validatedUpdateData.title = newTitle;
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

    revalidatePath(`/workspace/${validatedPageId}`);

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
  const user = await currentUser();

  if (!user?.externalId) {
    throw new Error("Unauthorized");
  }
  try {
    const { pageId: validatedPageId, tagId: validatedTagId } =
      addTagToPageSchema.parse({ pageId, tagId });

    await db.insert(pages_tags).values({
      page_id: validatedPageId,
      tag_id: validatedTagId,
    });

    revalidatePath(`/workspace/${validatedPageId}`);
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
  const user = await currentUser();

  if (!user?.externalId) {
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

    revalidatePath(`/workspace/${validatedPageId}`);
    return { success: true };
  } catch (error) {
    console.error("Error removing tag:", error);
    return { error: "Failed to remove tag" };
  }
}

// Keep track of running parsing jobs to avoid duplicates
const runningJobs = new Set<string>();

// Keep track of running link processing jobs to avoid duplicates
const runningLinkJobs = new Set<string>();

async function processPageLinks(
  pageId: string,
  jsonContent: any,
): Promise<void> {
  // Prevent duplicate processing for the same page
  if (runningLinkJobs.has(pageId)) {
    return;
  }

  runningLinkJobs.add(pageId);

  try {
    // Extract linked page IDs from the TipTap JSON
    const linkedPageIds = extractLinksFromTipTapJSON(jsonContent);

    // Update the page links in the database
    const result = await updatePageLinks(pageId, linkedPageIds);

    if (!result.success) {
      throw new Error(result.error || "Failed to update page links");
    }
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        operation: "process_page_links",
        component: "background_processing",
      },
      extra: {
        pageId,
        jsonContentSize: JSON.stringify(jsonContent).length,
        timestamp: new Date().toISOString(),
      },
      level: "error",
    });

    // Re-throw to be caught by outer handler
    throw error;
  } finally {
    // Always clean up the running job tracker
    runningLinkJobs.delete(pageId);
  }
}

async function parseAndUpdateMetadataOptimized(
  pageId: string,
  newContent: string,
): Promise<void> {
  // Prevent duplicate processing for the same page
  if (runningJobs.has(pageId)) {
    return;
  }

  runningJobs.add(pageId);

  try {
    // Get the current page data to compare content
    const currentPage = await db.query.pages.findFirst({
      where: eq(pages.id, pageId),
      columns: {
        content: true,
        content_type: true,
        description: true,
        image_previews: true,
      },
    });

    if (!currentPage) {
      return;
    }

    // Skip metadata parsing for canvas pages - only parse for regular pages
    if (currentPage.content_type !== "page") {
      return;
    }

    // FORCE parsing if metadata is missing, regardless of content changes
    const isMissingMetadata =
      !currentPage.description ||
      !currentPage.image_previews ||
      currentPage.image_previews.length === 0;

    if (isMissingMetadata) {
    } else {
      // Only check content changes if we already have metadata
      const oldContent = currentPage.content || "";
      if (!hasContentChangedSignificantly(oldContent, newContent)) {
        return;
      }
    }

    // Extract metadata from the new content
    const metadata = extractPageMetadata(newContent);

    // Only update if metadata actually changed (unless it was missing)
    const hasDescriptionChanged =
      metadata.description !== currentPage.description;
    const hasImagesChanged =
      JSON.stringify(metadata.imagePreviews) !==
      JSON.stringify(currentPage.image_previews);

    if (!isMissingMetadata && !hasDescriptionChanged && !hasImagesChanged) {
      return;
    }

    // Update the database with the parsed metadata
    await db
      .update(pages)
      .set({
        description: metadata.description,
        image_previews: metadata.imagePreviews,
      })
      .where(eq(pages.id, pageId));
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        operation: "optimized_metadata_parsing",
        component: "background_processing",
      },
      extra: {
        pageId,
        contentLength: newContent.length,
        timestamp: new Date().toISOString(),
      },
      level: "error",
    });
  } finally {
    // Always clean up the running job tracker
    runningJobs.delete(pageId);
  }
}

// Optimized save function
export async function savePageContent(
  pageId: string,
  content: string,
  jsonContent?: any,
) {
  const user = await currentUser();
  if (!user?.externalId) {
    throw new Error("Unauthorized");
  }

  // Verify user has access to this page
  const userPage = await db.query.users_pages.findFirst({
    where: and(
      eq(users_pages.page_id, pageId),
      eq(users_pages.user_id, user.externalId),
    ),
  });

  if (!userPage) {
    throw new Error("Page not found or unauthorized");
  }

  // Save the content first (existing logic)
  try {
    await db
      .update(pages)
      .set({
        content: content,
        updated_at: new Date(),
      })
      .where(eq(pages.id, pageId));
  } catch (dbError) {
    Sentry.captureException(dbError, {
      tags: {
        operation: "database_save_content",
        component: "save_page_content",
      },
      extra: {
        pageId,
        userId: user.externalId,
        contentLength: content.length,
        hasJsonContent: !!jsonContent,
      },
      level: "error",
    });
    throw dbError;
  }

  // 🔥 Fire off background node hash generation and incremental embedding
  processNodeHashesAndEmbeddings(pageId, content, user.externalId).catch(
    (error) => {
      Sentry.captureException(error, {
        tags: {
          operation: "node_hashes_and_embeddings_outer_catch",
          component: "save_page_content",
        },
        extra: {
          pageId,
          userId: user.externalId,
          message: "Error escaped node hash and embedding processing",
        },
        level: "error",
      });
    },
  );

  // 🔥 Fire off optimized background metadata parsing
  parseAndUpdateMetadataOptimized(pageId, content).catch((error) => {
    Sentry.captureException(error, {
      tags: {
        operation: "optimized_metadata_parsing_outer_catch",
        component: "save_page_content",
      },
      extra: {
        pageId,
        userId: user.externalId,
        message: "Error escaped optimized metadata parsing",
      },
      level: "error",
    });
  });

  // 🔥 Fire off background link processing if JSON content is provided
  if (jsonContent) {
    processPageLinks(pageId, jsonContent).catch((error) => {
      Sentry.captureException(error, {
        tags: {
          operation: "page_links_processing_outer_catch",
          component: "save_page_content",
        },
        extra: {
          pageId,
          userId: user.externalId,
          message: "Error escaped page links processing",
        },
        level: "error",
      });
    });
  }

  return { success: true };
}

// New background process for node hashes and incremental embeddings
const runningNodeJobs = new Set<string>();

async function processNodeHashesAndEmbeddings(
  pageId: string,
  content: string,
  userId: string,
): Promise<void> {
  // Prevent duplicate processing for the same page
  if (runningNodeJobs.has(pageId)) {
    return;
  }

  runningNodeJobs.add(pageId);

  try {
    // Update node hashes and detect changes
    const nodeHashResult = await updatePageNodeHashes(pageId, content, userId);

    if (!nodeHashResult.success) {
      throw new Error(`Failed to update node hashes: ${nodeHashResult.error}`);
    }

    const changedNodes = nodeHashResult.changedNodes || [];

    // Only regenerate embeddings if there are significant changes
    if (changedNodes.length > 0) {
      const hasSignificantChanges = await hasSignificantNodeChanges(
        pageId,
        changedNodes,
      );

      if (hasSignificantChanges) {
        console.log(
          `Detected ${changedNodes.length} node changes for page ${pageId}, triggering incremental embedding update`,
        );

        // Generate embeddings incrementally
        const embeddingResult = await generatePageEmbeddingsWithContext(
          pageId,
          userId,
          false,
        );

        if (embeddingResult.success) {
          console.log(
            `✓ Incremental embedding update complete for page ${pageId}:`,
            {
              created: embeddingResult.chunksCreated,
              updated: embeddingResult.chunksUpdated,
              unchanged: embeddingResult.chunksUnchanged,
            },
          );
        } else {
          throw new Error(
            `Incremental embedding update failed: ${embeddingResult.error}`,
          );
        }
      } else {
        console.log(
          `Node changes for page ${pageId} don't require embedding updates`,
        );
      }
    }
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        operation: "process_node_hashes_and_embeddings",
        component: "background_processing",
      },
      extra: {
        pageId,
        userId,
        contentLength: content.length,
        timestamp: new Date().toISOString(),
      },
      level: "error",
    });

    throw error;
  } finally {
    runningNodeJobs.delete(pageId);
  }
}

export type CreatePageInput = {
  title: string;
  tag_id?: string; // Make optional
  hierarchy?: string[]; // Make optional
  folder_id: string | null;
};

export async function createPage(
  input: CreatePageInput,
  type: "page" | "canvas",
) {
  try {
    const user = await currentUser();

    if (!user?.externalId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const userId = user.externalId;

    // Start a transaction since we need to insert into multiple tables
    return await db.transaction(async (tx) => {
      // 1. Check for duplicate titles and auto-rename if needed
      const existingPages = await tx
        .select({ title: pages.title })
        .from(pages)
        .innerJoin(users_pages, eq(users_pages.page_id, pages.id))
        .where(and(eq(users_pages.user_id, userId), eq(pages.deleted, false)));

      let newTitle = input.title;
      let counter = 2;
      const baseTitle = input.title;

      while (existingPages.some((page) => page.title === newTitle)) {
        newTitle = `${baseTitle} (${counter})`;
        counter++;
      }

      // 2. Create the page
      const [newPage] = await tx
        .insert(pages)
        .values({
          title: newTitle,
          content: type === "canvas" ? JSON.stringify({ document: "" }) : "",
          content_type: type,
          primary_tag_id: input.tag_id || null, // Handle optional tag
          folder_id: input.folder_id,
        })
        .returning();

      if (!newPage) {
        throw new Error("Failed to create page");
      }

      // 4. Create the user-page relationship (as owner)
      await tx.insert(users_pages).values({
        user_id: userId,
        page_id: newPage.id,
        role: "owner",
      });

      // 5. Fetch the complete page data with its relationships
      const pageWithRelations = await tx.query.pages.findFirst({
        where: eq(pages.id, newPage.id),
        with: {
          tags: true,
        },
      });

      revalidatePath("/workspace");

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

export type CreatePageFromWebhookInput = {
  title: string;
  content: string;
  content_type: "page" | "canvas";
  resource_id?: string;
  user_id?: string;
  primary_tag_id?: string;
};

export async function createPageWithRelationsFromWebhook(
  input: CreatePageFromWebhookInput,
) {
  try {
    return await db.transaction(async (tx) => {
      // 1. Check for duplicate titles if user_id exists
      if (input.user_id) {
        const existingPages = await tx
          .select({ title: pages.title })
          .from(pages)
          .innerJoin(users_pages, eq(users_pages.page_id, pages.id))
          .where(
            and(
              eq(users_pages.user_id, input.user_id),
              eq(pages.deleted, false),
            ),
          );

        let newTitle = input.title;
        let counter = 1;

        while (existingPages.some((page) => page.title === newTitle)) {
          newTitle = `${input.title} (${counter})`;
          counter++;
        }

        input.title = newTitle;
      }

      // 2. Create the page
      const [newPage] = await tx
        .insert(pages)
        .values({
          title: input.title,
          content: input.content,
          content_type: input.content_type,
          primary_tag_id: input.primary_tag_id,
        })
        .returning();
      if (!newPage) {
        throw new Error("Failed to create page");
      }

      // 3. Create user relation if userId exists
      if (input.user_id) {
        await tx.insert(users_pages).values({
          user_id: input.user_id,
          page_id: newPage.id,
          role: "owner",
        });
      }

      // 4. Create resource relation if resourceId exists
      if (input.resource_id) {
        await tx.insert(resourcesPages).values({
          resource_id: input.resource_id,
          page_id: newPage.id,
        });
      }

      return {
        success: true,
        page: newPage,
      };
    });
  } catch (error) {
    console.error("Failed to create page with relations:", error);
    return {
      success: false,
      error: "Failed to create page with relations",
    };
  }
}

const movePageSchema = z.object({
  pageId: z.string().uuid(),
  destinationId: z.string(), // Can be "folder-uuid" or "tag-uuid"
});

export async function movePage(input: z.infer<typeof movePageSchema>) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = user.externalId;

    const { pageId, destinationId } = movePageSchema.parse(input);
    const [type = "", ...idParts] = destinationId.split("-");
    const id = idParts.join("-");

    if (!["folder", "tag"].includes(type) || !id) {
      return { success: false, error: "Invalid destination" };
    }

    return await db.transaction(async (tx) => {
      // Check page access
      const pageAccess = await tx.query.pages.findFirst({
        where: and(
          eq(pages.id, pageId),
          eq(pages.deleted, false),
          exists(
            tx
              .select()
              .from(users_pages)
              .where(
                and(
                  eq(users_pages.page_id, pageId),
                  eq(users_pages.user_id, userId),
                ),
              ),
          ),
        ),
      });

      if (!pageAccess) {
        throw new Error("Page not found or no access");
      }

      if (type === "folder") {
        // Check folder access
        const destFolder = await tx.query.folders.findFirst({
          where: and(
            eq(folders.id, id),
            or(
              eq(folders.user_id, userId),
              exists(
                tx
                  .select()
                  .from(users_folders)
                  .where(
                    and(
                      eq(users_folders.folder_id, id),
                      eq(users_folders.user_id, userId),
                    ),
                  ),
              ),
            ),
          ),
        });

        if (!destFolder) {
          throw new Error("Folder not found or no access");
        }

        // Check for name conflicts in destination folder
        const existingPages = await tx
          .select({ title: pages.title })
          .from(pages)
          .where(and(eq(pages.folder_id, id), eq(pages.deleted, false)));

        let newTitle = pageAccess.title;
        let counter = 1;
        const baseTitle = pageAccess.title.replace(/ \(\d+\)$/, "");

        while (existingPages.some((p) => p.title === newTitle)) {
          newTitle = `${baseTitle} (${counter})`;
          counter++;
        }

        // Update page with new folder and maintain tag relationships
        await tx
          .update(pages)
          .set({
            folder_id: id,
            title: newTitle,
            primary_tag_id: destFolder.tag_id,
            updated_at: new Date(),
          })
          .where(eq(pages.id, pageId));

        // Add new tag relationship if it doesn't exist
        await tx
          .insert(pages_tags)
          .values({
            page_id: pageId,
            tag_id: destFolder.tag_id,
          })
          .onConflictDoNothing();
      } else if (type === "tag") {
        // Reuse existing movePagesBetweenTags logic
        return movePagesBetweenTags({
          pageId,
          newTagId: id,
        });
      }
      revalidatePath("/workspace");
      return { success: true };
    });
  } catch (error) {
    console.error("Error moving page:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to move page",
    };
  }
}

const searchPagesSchema = z.object({
  query: z.string().min(1),
});

export async function searchPages(query: string) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      throw new Error("Unauthorized");
    }

    const { query: validatedQuery } = searchPagesSchema.parse({ query });

    // Get all pages the user has access to with full-text search
    const searchResults = await db
      .select({
        id: pages.id,
        title: pages.title,
        content: pages.content,
        updated_at: pages.updated_at,
        content_type: pages.content_type,
      })
      .from(pages)
      .innerJoin(users_pages, eq(users_pages.page_id, pages.id))
      .where(
        and(
          eq(users_pages.user_id, user.externalId),
          eq(pages.deleted, false),
          sql`to_tsvector('english', ${pages.title}) @@ plainto_tsquery('english', ${validatedQuery})`,
        ),
      )
      .orderBy(pages.updated_at);

    return {
      success: true,
      data: searchResults,
    };
  } catch (error) {
    console.error("Error searching pages:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to search pages",
    };
  }
}

export async function updatePageTitle(pageId: string, title: string) {
  const user = await currentUser();
  if (!user?.externalId) {
    throw new Error("Unauthorized");
  }

  // Check if the user has access to the page (reuse your existing pattern)
  const userPage = await db.query.users_pages.findFirst({
    where: and(
      eq(users_pages.user_id, user.externalId),
      eq(users_pages.page_id, pageId),
    ),
  });

  if (!userPage) {
    throw new Error("Page not found or user doesn't have access");
  }

  // Validate title
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    throw new Error("Valid title is required");
  }

  if (title.length > 200) {
    throw new Error("Title cannot exceed 200 characters");
  }

  // Update the title
  const result = await db
    .update(pages)
    .set({
      title: title.trim(),
      updated_at: new Date(),
    })
    .where(eq(pages.id, pageId))
    .returning({
      title: pages.title,
    });

  return result[0]?.title;
}

export async function archivePageManually(pageId: string) {
  try {
    const user = await currentUser();

    if (!user?.externalId) {
      throw new Error("Unauthorized");
    }

    // Check if the user has access to the page
    const userPage = await db.query.users_pages.findFirst({
      where: and(
        eq(users_pages.user_id, user.externalId),
        eq(users_pages.page_id, pageId),
      ),
    });

    if (!userPage) {
      throw new Error("Page not found or user doesn't have access");
    }

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
        archived: pages.archived,
      });

    if (result.length === 0 || !result[0]) {
      throw new Error("Failed to archive page");
    }

    revalidatePath(`/workspace/${pageId}`);
    revalidatePath("/workspace");

    return {
      success: true,
      data: result[0],
    };
  } catch (error) {
    console.error("Error archiving page:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to archive page",
    };
  }
}

export async function unarchivePageManually(pageId: string) {
  try {
    const user = await currentUser();

    if (!user?.externalId) {
      throw new Error("Unauthorized");
    }

    // Check if the user has access to the page
    const userPage = await db.query.users_pages.findFirst({
      where: and(
        eq(users_pages.user_id, user.externalId),
        eq(users_pages.page_id, pageId),
      ),
    });

    if (!userPage) {
      throw new Error("Page not found or user doesn't have access");
    }

    const result = await db
      .update(pages)
      .set({
        archived: false,
        updated_at: new Date(),
      })
      .where(eq(pages.id, pageId))
      .returning({
        id: pages.id,
        title: pages.title,
        archived: pages.archived,
      });

    if (result.length === 0 || !result[0]) {
      throw new Error("Failed to unarchive page");
    }

    revalidatePath(`/workspace/${pageId}`);
    revalidatePath("/workspace");

    return {
      success: true,
      data: result[0],
    };
  } catch (error) {
    console.error("Error unarchiving page:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to unarchive page",
    };
  }
}

const deleteMultiplePagesSchema = z.object({
  pageIds: z.array(z.string().uuid()).min(1),
});

export async function deleteMultiplePages(
  input: z.infer<typeof deleteMultiplePagesSchema>,
) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return { success: false, error: "Unauthorized" };
    }
    const userId = user.externalId;
    const { pageIds } = deleteMultiplePagesSchema.parse(input);

    return await db.transaction(async (tx) => {
      // Verify user has access to all pages
      const userPages = await tx
        .select({ pageId: users_pages.page_id })
        .from(users_pages)
        .where(
          and(
            eq(users_pages.user_id, userId),
            sql`${users_pages.page_id} = ANY(${pageIds})`,
          ),
        );

      const accessiblePageIds = userPages.map((up) => up.pageId);

      // Check if user has access to all requested pages
      if (accessiblePageIds.length !== pageIds.length) {
        throw new Error("Access denied to some pages");
      }

      // Delete all pages in one query
      await tx
        .update(pages)
        .set({
          deleted: true,
          updated_at: new Date(),
        })
        .where(sql`${pages.id} = ANY(${pageIds})`);

      return { success: true, deletedCount: pageIds.length };
    });
  } catch (error) {
    console.error("Error deleting multiple pages:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete pages",
    };
  }
}
