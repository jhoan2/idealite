import { db } from "~/server/db";
import { pages, users_pages } from "~/server/db/schema";
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
