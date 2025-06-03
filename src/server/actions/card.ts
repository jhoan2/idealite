"use server";

import { cards, cards_tags, pages_tags, users } from "~/server/db/schema";
import { z } from "zod";
import { db } from "~/server/db";
import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";
import { currentUser } from "@clerk/nextjs/server";

const createCardSchema = z.object({
  pageId: z.string().uuid(),
  content: z.string().min(1).optional(),
  imageCid: z.string().optional(),
  canvasImageCid: z.string().optional(),
  description: z.string().min(1).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  resourceId: z.string().uuid().optional(),
  nextReview: z.string().datetime().optional(),
  cardType: z.enum(["qa", "image", "cloze"]).optional(),
  question: z.string().optional(),
  answer: z.string().optional(),
  clozeTemplate: z.string().optional(),
  clozeAnswers: z.string().optional(),
  sourceLocator: z
    .object({
      type: z.enum(["page", "canvas"]),
      pointer: z.string().optional(),
    })
    .optional(),
});

export async function createCardFromPage(
  input: z.infer<typeof createCardSchema>,
  overrideUserId?: string,
): Promise<{
  success: boolean;
  data?: typeof cards.$inferSelect;
  error?: string;
}> {
  try {
    const validatedInput = createCardSchema.parse(input);
    let userId: string | undefined;

    if (overrideUserId) {
      // Use the provided userId (from QStash job)
      userId = overrideUserId;
    } else {
      // Get it from the authenticated user (normal browser request)
      const user = await currentUser();
      userId = user?.externalId || undefined;
    }

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    return await db.transaction(async (tx) => {
      // Create the card
      const [newCard] = await tx
        .insert(cards)
        .values({
          user_id: userId,
          page_id: validatedInput.pageId,
          content: validatedInput.content,
          image_cid: validatedInput.imageCid,
          description: validatedInput.description,
          resource_id: validatedInput.resourceId,
          next_review: validatedInput.nextReview
            ? new Date(validatedInput.nextReview)
            : null,
          card_type:
            validatedInput.cardType ||
            (validatedInput.question && validatedInput.answer
              ? "qa"
              : validatedInput.clozeTemplate && validatedInput.clozeAnswers
                ? "cloze"
                : "image"),
          question: validatedInput.question,
          answer: validatedInput.answer,
          cloze_template: validatedInput.clozeTemplate,
          cloze_answers: validatedInput.clozeAnswers,
          source_locator: validatedInput.sourceLocator,
        })
        .returning();

      if (!newCard) {
        throw new Error("Failed to create card");
      }

      // Use provided tag IDs instead of querying the database
      if (validatedInput.tagIds && validatedInput.tagIds.length > 0) {
        await tx.insert(cards_tags).values(
          validatedInput.tagIds.map((tagId) => ({
            card_id: newCard.id,
            tag_id: tagId,
          })),
        );
      } else {
        // Fallback to querying if no tags provided (for backward compatibility)
        const pageTags = await tx
          .select({
            tag_id: pages_tags.tag_id,
          })
          .from(pages_tags)
          .where(eq(pages_tags.page_id, validatedInput.pageId));

        if (pageTags.length > 0) {
          await tx.insert(cards_tags).values(
            pageTags.map((tag) => ({
              card_id: newCard.id,
              tag_id: tag.tag_id,
            })),
          );
        }
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
  description: z.string().optional(),
  question: z.string().optional(),
  answer: z.string().optional(),
  status: z.enum(["active", "mastered", "suspended"]).optional(),
  sourceLocator: z
    .object({
      type: z.enum(["page", "canvas"]),
      pointer: z.string().optional(),
    })
    .optional(),
});

export async function updateCard(input: z.infer<typeof updateCardSchema>) {
  const user = await currentUser();
  const userId = user?.externalId;
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const validatedInput = updateCardSchema.parse(input);

  const [updatedCard] = await db
    .update(cards)
    .set({
      ...validatedInput,
      updated_at: new Date(),
    })
    .where(and(eq(cards.id, validatedInput.id), eq(cards.user_id, userId)))
    .returning();

  revalidatePath(`/workspace/${updatedCard?.page_id}`);
  return updatedCard;
}

export async function deleteCard(cardId: string) {
  const user = await currentUser();
  const userId = user?.externalId;
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const [deletedCard] = await db
    .update(cards)
    .set({
      deleted: true,
      updated_at: new Date(),
    })
    .where(and(eq(cards.id, cardId), eq(cards.user_id, userId)))
    .returning();

  if (!deletedCard) {
    throw new Error("Card not found or unauthorized");
  }

  revalidatePath(`/workspace/${deletedCard.page_id}`);
  return deletedCard;
}

const processFlashCardsSchema = z.object({
  id: z.string().uuid(),
  content: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["active", "mastered", "suspended"]).optional(),
  next_review: z.string().datetime().optional(),
  last_reviewed: z.string().datetime().optional(),
});

export async function processFlashCards(
  input:
    | z.infer<typeof processFlashCardsSchema>
    | Array<{
        id: string;
        status: "active" | "mastered" | "suspended";
        next_review: string | null;
        last_reviewed: string;
      }>,
) {
  const user = await currentUser();
  const userId = user?.externalId;
  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (Array.isArray(input)) {
    return await db.transaction(async (tx) => {
      const results = await Promise.all(
        input.map((update) =>
          tx
            .update(cards)
            .set({
              status: update.status,
              next_review: update.next_review
                ? new Date(update.next_review)
                : null,
              last_reviewed: new Date(update.last_reviewed),
              updated_at: new Date(),
            })
            .where(and(eq(cards.id, update.id), eq(cards.user_id, userId)))
            .returning(),
        ),
      );

      // Revalidate paths if needed
      revalidatePath(`/review`);
      return results.map(([card]) => card);
    });
  }

  // Handle single update
  const validatedInput = processFlashCardsSchema.parse(input);
  const [updatedCard] = await db
    .update(cards)
    .set({
      ...validatedInput,
      next_review: validatedInput.next_review
        ? new Date(validatedInput.next_review)
        : undefined,
      last_reviewed: validatedInput.last_reviewed
        ? new Date(validatedInput.last_reviewed)
        : undefined,
      updated_at: new Date(),
    })
    .where(and(eq(cards.id, validatedInput.id), eq(cards.user_id, userId)))
    .returning();

  revalidatePath(`/review`);
  return updatedCard;
}
