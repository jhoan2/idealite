"use server";

import { cards, cards_tags, pages_tags, users } from "~/server/db/schema";
import { z } from "zod";
import { db } from "~/server/db";
import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { getDueFlashCards } from "../queries/card";
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
    const user = await currentUser();
    const userId = user?.externalId;

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
  status: z.enum(["active", "mastered", "suspended"]).optional(),
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

export async function createQuestionAndAnswer() {
  const user = await currentUser();
  const userId = user?.externalId;
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const dueCards = await getDueFlashCards();

  if (!dueCards.length) {
    return [];
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_DEPLOYMENT_URL}/api/flashcards`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cards: dueCards,
        type: "question-answer",
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to generate flashcards");
  }

  const data = await response.json();
  return data.flashcards;
}

export async function createClozeCards() {
  const user = await currentUser();
  const userId = user?.externalId;
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const dueCards = await getDueFlashCards();

  if (!dueCards.length) {
    return [];
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_DEPLOYMENT_URL}/api/flashcards`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cards: dueCards,
        type: "cloze",
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to generate flashcards");
  }

  const data = await response.json();
  return data.flashcards;
}

const processFlashCardsSchema = z.object({
  id: z.string().uuid(),
  content: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["active", "mastered", "suspended"]).optional(),
});

// Accept either a single update or an array of updates
export async function processFlashCards(
  input:
    | z.infer<typeof processFlashCardsSchema>
    | Array<Pick<z.infer<typeof processFlashCardsSchema>, "id" | "status">>,
) {
  const user = await currentUser();
  const userId = user?.externalId;
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Handle batch updates
  if (Array.isArray(input)) {
    return await db.transaction(async (tx) => {
      const results = await Promise.all(
        input.map((update) =>
          tx
            .update(cards)
            .set({
              status: update.status,
              updated_at: new Date(),
            })
            .where(and(eq(cards.id, update.id), eq(cards.user_id, userId)))
            .returning(),
        ),
      );

      // Revalidate paths if needed
      revalidatePath(`/play`);
      return results.map(([card]) => card);
    });
  }

  // Handle single update
  const validatedInput = processFlashCardsSchema.parse(input);
  const [updatedCard] = await db
    .update(cards)
    .set({
      ...validatedInput,
      updated_at: new Date(),
    })
    .where(and(eq(cards.id, validatedInput.id), eq(cards.user_id, userId)))
    .returning();

  revalidatePath(`/play`);
  return updatedCard;
}

export async function createCardFromGame(content: string, tagId: string) {
  try {
    const user = await currentUser();
    const userId = user?.externalId;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const twoWeeksFromNow = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    return await db.transaction(async (tx) => {
      // Create the new card
      const [newCard] = await tx
        .insert(cards)
        .values({
          content,
          user_id: userId,
          created_at: new Date(),
          updated_at: new Date(),
          next_review: twoWeeksFromNow,
          status: "active",
        })
        .returning();

      if (!newCard) {
        throw new Error("Failed to create card");
      }

      // Create card-tag relationship
      await tx.insert(cards_tags).values({
        card_id: newCard.id,
        tag_id: tagId,
      });

      // Increment user's cash by 1
      await tx
        .update(users)
        .set({
          cash: sql`${users.cash} + 1`,
          updated_at: new Date(),
        })
        .where(eq(users.id, userId));

      return newCard;
    });
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
}
