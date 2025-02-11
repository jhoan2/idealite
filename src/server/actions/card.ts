"use server";

import { cards, cards_tags, pages_tags } from "~/server/db/schema";
import { z } from "zod";
import { auth } from "~/app/auth";
import { db } from "~/server/db";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

const createCardSchema = z.object({
  pageId: z.string().uuid(),
  content: z.string().min(1).optional(),
  imageCid: z.string().optional(),
  canvasImageCid: z.string().optional(),
  prompt: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  resourceId: z.string().uuid().optional(),

  nextReview: z.string().datetime().optional(),
});

export async function createCardFromPage(
  input: z.infer<typeof createCardSchema>,
): Promise<{
  success: boolean;
  data?: typeof cards.$inferSelect;
  error?: string;
}> {
  try {
    const validatedInput = createCardSchema.parse(input);
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    return await db.transaction(async (tx) => {
      // First get the page's tags
      const pageTags = await tx
        .select({
          tag_id: pages_tags.tag_id,
        })
        .from(pages_tags)
        .where(eq(pages_tags.page_id, validatedInput.pageId));

      // Create the card
      const [newCard] = await tx
        .insert(cards)
        .values({
          user_id: session?.user?.id || "",
          page_id: validatedInput.pageId,
          content: validatedInput.content,
          image_cid: validatedInput.imageCid,
          canvas_image_cid: validatedInput.canvasImageCid,
          prompt: validatedInput.prompt,
          description: validatedInput.description,
          resource_id: validatedInput.resourceId,
          next_review: validatedInput.nextReview
            ? new Date(validatedInput.nextReview)
            : null,
        })
        .returning();

      if (!newCard) {
        throw new Error("Failed to create card");
      }

      // Create card-tag relationships based on page tags
      if (pageTags.length > 0) {
        await tx.insert(cards_tags).values(
          pageTags.map((tag) => ({
            card_id: newCard.id,
            tag_id: tag.tag_id,
          })),
        );
      }

      revalidatePath(`/workspace/${validatedInput.pageId}`);
      return { success: true, data: newCard };
    });
  } catch (error) {
    console.error("Error creating card:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create card",
    };
  }
}

const updateCardSchema = z.object({
  id: z.string().uuid(),
  content: z.string().optional(),
  prompt: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["active", "mastered", "suspended"]).optional(),
});

export async function updateCard(input: z.infer<typeof updateCardSchema>) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const validatedInput = updateCardSchema.parse(input);

  const [updatedCard] = await db
    .update(cards)
    .set({
      ...validatedInput,
      updated_at: new Date(),
    })
    .where(
      and(eq(cards.id, validatedInput.id), eq(cards.user_id, session.user.id)),
    )
    .returning();

  revalidatePath(`/workspace/${updatedCard?.page_id}`);
  return updatedCard;
}

export async function deleteCard(cardId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const [deletedCard] = await db
    .update(cards)
    .set({
      deleted: true,
      updated_at: new Date(),
    })
    .where(and(eq(cards.id, cardId), eq(cards.user_id, session.user.id)))
    .returning();

  if (!deletedCard) {
    throw new Error("Card not found or unauthorized");
  }

  revalidatePath(`/workspace/${deletedCard.page_id}`);
  return deletedCard;
}
