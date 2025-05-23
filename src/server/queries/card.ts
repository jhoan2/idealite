"use server";

import { db } from "~/server/db";
import { cards } from "~/server/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq, lte, isNotNull, not } from "drizzle-orm";

export type Card = typeof cards.$inferSelect & {
  tags: {
    id: string;
    name: string;
    parent_id: string | null;
    created_at: Date;
    updated_at: Date | null;
    deleted: boolean | null;
    is_template: boolean | null;
  }[];
};
export async function getPageCards(pageId: string): Promise<Card[]> {
  const user = await currentUser();
  if (!user?.externalId) {
    throw new Error("Unauthorized");
  }

  const pageCards = await db.query.cards.findMany({
    where: and(
      eq(cards.page_id, pageId),
      eq(cards.user_id, user.externalId),
      eq(cards.deleted, false),
    ),
    with: {
      tags: {
        with: {
          tag: true,
        },
      },
    },
    orderBy: cards.created_at,
  });

  return pageCards.map((card) => ({
    ...card,

    tags: card.tags.map(({ tag }) => ({
      id: tag.id,
      name: tag.name,
      parent_id: tag.parent_id,
      created_at: tag.created_at,
      updated_at: tag.updated_at,
      deleted: tag.deleted,
      is_template: tag.is_template,
    })),
  }));
}

export async function getDueFlashCards() {
  //Flashcards are cards that have content, which is different from those cards with images.
  const user = await currentUser();

  if (!user?.externalId) {
    throw new Error("Unauthorized");
  }

  return await db.query.cards.findMany({
    where: and(
      eq(cards.user_id, user.externalId),
      eq(cards.status, "active"),
      eq(cards.deleted, false),
      lte(cards.next_review, new Date()),
      // Ignore cards with empty content
      not(eq(cards.content, "")),
      isNotNull(cards.content),
    ),
    limit: 20,
  });
}
