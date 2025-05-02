"use server";

import { db } from "~/server/db";
import { cards, cards_tags } from "~/server/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq, lte, isNotNull, not, inArray, sql } from "drizzle-orm";

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

export async function getDueFlashCards({
  status = "active",
  tags = [],
  limit = 20,
  getCards = false,
}: {
  status?: "active" | "mastered" | "suspended" | "all";
  tags?: string[];
  limit?: number;
  getCards?: boolean;
} = {}) {
  const user = await currentUser();

  if (!user?.externalId) {
    throw new Error("Unauthorized");
  }

  let whereConditions = [
    eq(cards.user_id, user.externalId),
    eq(cards.deleted, false),
  ];

  if (status === "active") {
    whereConditions.push(eq(cards.status, "active"));
    whereConditions.push(lte(cards.next_review, new Date()));
  } else if (status === "mastered") {
    whereConditions.push(eq(cards.status, "mastered"));
  } else if (status === "suspended") {
    whereConditions.push(eq(cards.status, "suspended"));
  }

  if (tags.length > 0) {
    const taggedCards = db
      .select({ cardId: cards_tags.card_id })
      .from(cards_tags)
      .where(inArray(cards_tags.tag_id, tags));

    whereConditions.push(inArray(cards.id, taggedCards));
  }

  const result = await db
    .select({ count: sql<number>`count(${cards.id})` })
    .from(cards)
    .where(and(...whereConditions));

  const count = result[0]?.count || 0;

  if (getCards) {
    const dueCards = await db.query.cards.findMany({
      where: and(...whereConditions),
      limit: limit,
      with: {
        tags: {
          with: {
            tag: true,
          },
        },
      },
    });

    const formattedCards = dueCards.map((card) => ({
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

    return {
      count: count,
      cards: formattedCards,
    };
  }

  return { count: count };
}
