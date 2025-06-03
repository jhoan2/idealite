// lib/flashcards/processFlashcards.ts
import { db } from "~/server/db";
import { cards, cards_tags } from "~/server/db/schema";
import { tryCatch } from "~/lib/tryCatch";
import { PersistableCard } from "./generateFlashcards";
import * as Sentry from "@sentry/nextjs";

/**
 * Validates and de-duplicates flashcards
 * - Removes cards without citations
 * - Removes duplicate questions (case-insensitive)
 */
export function postProcess(raw: PersistableCard[]): PersistableCard[] {
  const seen = new Set<string>();
  return raw.filter((c) => {
    if (!c.primaryId) return false; // drop cards without citation
    const key = c.question.toLowerCase();
    if (seen.has(key)) return false; // drop duplicate questions
    seen.add(key);
    return true;
  });
}

/**
 * Saves flashcards to the database
 * @param cardsIn - Validated flashcards to save
 * @param userId - User ID who owns the flashcards
 * @param pageId - Page ID the flashcards are associated with
 * @param tagIds - Optional tag IDs to associate with the flashcards
 */
export async function saveFlashcards(
  cardsIn: PersistableCard[],
  userId: string,
  pageId: string,
  tagIds?: string[],
) {
  if (!cardsIn.length) {
    console.log("[Flashcards] No cards to save");
    return { saved: 0, failed: 0 };
  }

  const rows = cardsIn.map((card) => ({
    user_id: userId,
    page_id: pageId,
    card_type: "qa" as const,
    question: card.question,
    answer: card.answer,
    source_locator: {
      type: "page",
      primary_id: card.primaryId,
      node_ids: [card.primaryId, ...card.additional],
    },
  }));

  const { error, data } = await tryCatch(
    db.transaction(async (tx) => {
      // Insert the flashcards
      const inserted = await tx
        .insert(cards)
        .values(rows)
        .returning({ id: cards.id });

      // If tag IDs are provided, associate them with the flashcards
      if (tagIds?.length) {
        const cardTagRows = inserted.flatMap((card) =>
          tagIds.map((tagId) => ({
            card_id: card.id,
            tag_id: tagId,
          })),
        );

        await tx.insert(cards_tags).values(cardTagRows);
      }

      return inserted;
    }),
  );

  if (error) {
    Sentry.captureException(error, {
      tags: {
        action: "saveFlashcards",
        pageId: pageId,
      },
    });
    return { saved: 0, failed: cardsIn.length, error: error.message };
  }

  return {
    saved: cardsIn.length,
    failed: 0,
    insertedIds: data?.map((d) => d.id),
  };
}

/**
 * Optional: Save flashcards with automatic tag extraction from page
 * This function can extract tags from the page and automatically associate them
 */
export async function saveFlashcardsWithPageTags(
  cardsIn: PersistableCard[],
  userId: string,
  pageId: string,
) {
  if (!cardsIn.length) return { saved: 0, failed: 0 };

  try {
    // Get existing tags associated with the page
    const pageTagsQuery = await db.query.pages_tags.findMany({
      where: (pages_tags, { eq }) => eq(pages_tags.page_id, pageId),
      with: {
        tag: true,
      },
    });

    const tagIds = pageTagsQuery.map((pt) => pt.tag_id);

    return saveFlashcards(cardsIn, userId, pageId, tagIds);
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        action: "saveFlashcardsWithPageTags",
        pageId: pageId,
      },
    });
    return saveFlashcards(cardsIn, userId, pageId);
  }
}

/**
 * Enhanced version that validates node IDs exist in the HTML content
 * This ensures flashcard citations point to actual content
 */
export async function saveFlashcardsWithValidation(
  cardsIn: PersistableCard[],
  userId: string,
  pageId: string,
  htmlContent?: string,
  tagIds?: string[],
) {
  if (!cardsIn.length) return { saved: 0, failed: 0 };

  let validatedCards = cardsIn;

  // If HTML content is provided, validate that citations actually exist
  if (htmlContent) {
    const nodeIdsInHtml = new Set<string>();
    const nodeIdMatches = htmlContent.matchAll(/data-node-id="([^"]+)"/g);
    for (const match of nodeIdMatches) {
      const nodeId = match[1];
      if (nodeId) {
        nodeIdsInHtml.add(nodeId);
      }
    }

    validatedCards = cardsIn.filter((card) => {
      const hasValidPrimary = nodeIdsInHtml.has(card.primaryId);
      const validAdditional = card.additional.filter((id) =>
        nodeIdsInHtml.has(id),
      );

      if (!hasValidPrimary) {
        return false;
      }

      // Update additional citations to only include valid ones
      card.additional = validAdditional;
      return true;
    });

    const droppedCount = cardsIn.length - validatedCards.length;
    if (droppedCount > 0) {
      Sentry.captureMessage(
        `[Flashcards] Dropped ${droppedCount} cards with invalid citations`,
        {
          tags: {
            action: "saveFlashcardsWithValidation",
            pageId: pageId,
          },
        },
      );
    }
  }

  return saveFlashcards(validatedCards, userId, pageId, tagIds);
}
