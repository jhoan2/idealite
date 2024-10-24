"use server";

import { eq } from "drizzle-orm";
import { db } from "../db";
import { pages, users_pages, pages_tags } from "../db/schema";
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
