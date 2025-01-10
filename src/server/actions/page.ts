"use server";

import { db } from "~/server/db";
import {
  pages,
  pages_tags,
  resourcesPages,
  users_pages,
} from "~/server/db/schema";
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

    revalidatePath(`/workspace/${validatedPageId}`);
    return { success: true };
  } catch (error) {
    console.error("Error removing tag:", error);
    return { error: "Failed to remove tag" };
  }
}

export async function savePageContent(pageId: string, content: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Check if the user has access to the page
    const userPage = await db.query.users_pages.findFirst({
      where: and(
        eq(users_pages.user_id, session.user.id),
        eq(users_pages.page_id, pageId),
      ),
    });

    if (!userPage) {
      throw new Error("Page not found or user doesn't have access");
    }

    const updatedPage = await db
      .update(pages)
      .set({
        content,
        updated_at: new Date(),
      })
      .where(eq(pages.id, pageId))
      .returning();

    if (updatedPage.length === 0 || !updatedPage[0]) {
      throw new Error("Failed to save page");
    }

    revalidatePath(`/workspace/${pageId}`);

    return updatedPage[0];
  } catch (error) {
    console.error("Error saving page:", error);
    throw error;
  }
}

export type CreatePageInput = {
  title: string;
  tag_id: string;
  hierarchy: string[];
};

export async function createPage(
  input: CreatePageInput,
  type: "page" | "canvas",
) {
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
          content_type: type,
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

      // 4. Create page-tag relation
      await tx.insert(pages_tags).values({
        page_id: newPage.id,
        tag_id: input.primary_tag_id || "",
      });

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
