"use server";

import { db } from "~/server/db";
import { cards, cards_tags, pages } from "~/server/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq, lte, isNotNull, not, inArray, sql, ilike } from "drizzle-orm";

export type Card = typeof cards.$inferSelect & {
  tags: {
    id: string;
    name: string;
    parent_id: string | null;
    created_at: Date;
    updated_at: Date | null;
    deleted: boolean | null;
    is_template: boolean | null;
    embedding: number[];
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
      embedding: tag.embedding ?? [],
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

export async function getAllPagesWithCards() {
  const user = await currentUser();

  if (!user?.externalId) {
    throw new Error("Unauthorized");
  }
  const userId = user.externalId;

  // Build where conditions for pages
  const pageWhereConditions = [
    eq(pages.deleted, false),
    eq(pages.archived, false),
  ];

  // Get all pages
  const allPages = await db.query.pages.findMany({
    where: and(...pageWhereConditions),
    columns: {
      id: true,
      title: true,
      content_type: true,
      created_at: true,
    },
    orderBy: (pages, { desc }) => [desc(pages.created_at)],
  });

  // For each page, count active cards
  const pagesWithCardCounts = await Promise.all(
    allPages.map(async (page) => {
      const cardWhereConditions = [
        eq(cards.user_id, userId),
        eq(cards.page_id, page.id),
        eq(cards.deleted, false),
        eq(cards.status, "active"),
      ];

      const result = await db
        .select({ count: sql<number>`count(${cards.id})` })
        .from(cards)
        .where(and(...cardWhereConditions));

      const cardCount = result[0]?.count || 0;

      return {
        ...page,
        cardCount,
      };
    }),
  );

  // Filter out pages with 0 cards
  return pagesWithCardCounts.filter((page) => page.cardCount > 0);
}

export async function searchPagesForCards({
  searchQuery = "",
  tags = [],
}: {
  searchQuery?: string;
  tags?: string[];
} = {}) {
  const user = await currentUser();

  if (!user?.externalId) {
    throw new Error("Unauthorized");
  }
  const userId = user.externalId;

  // Build where conditions for pages
  let pageWhereConditions = [
    eq(pages.deleted, false),
    eq(pages.archived, false),
  ];

  if (searchQuery) {
    pageWhereConditions.push(ilike(pages.title, `%${searchQuery}%`));
  }

  // Get matching pages
  const matchingPages = await db.query.pages.findMany({
    where: and(...pageWhereConditions),
    columns: {
      id: true,
      title: true,
      content_type: true,
      created_at: true,
    },
    orderBy: pages.created_at,
  });

  // For each page, count cards that match the criteria
  const pagesWithCardCounts = await Promise.all(
    matchingPages.map(async (page) => {
      let cardWhereConditions = [
        eq(cards.user_id, userId),
        eq(cards.page_id, page.id),
        eq(cards.deleted, false),
        eq(cards.status, "active"),
      ];

      // Apply tag filtering if tags are specified
      if (tags.length > 0) {
        const taggedCards = db
          .select({ cardId: cards_tags.card_id })
          .from(cards_tags)
          .where(inArray(cards_tags.tag_id, tags));

        cardWhereConditions.push(inArray(cards.id, taggedCards));
      }

      const result = await db
        .select({ count: sql<number>`count(${cards.id})` })
        .from(cards)
        .where(and(...cardWhereConditions));

      const cardCount = result[0]?.count || 0;

      return {
        ...page,
        cardCount,
      };
    }),
  );

  // Filter out pages with 0 cards
  return pagesWithCardCounts.filter((page) => page.cardCount > 0);
}

export async function getCardsByPages({
  pageIds,
  tags = [],
}: {
  pageIds: string[];
  tags?: string[];
}) {
  const user = await currentUser();

  if (!user?.externalId) {
    throw new Error("Unauthorized");
  }

  if (pageIds.length === 0) {
    return [];
  }

  let whereConditions = [
    eq(cards.user_id, user.externalId),
    eq(cards.deleted, false),
    eq(cards.status, "active"),
    inArray(cards.page_id, pageIds),
  ];

  // Apply tag filtering if tags are specified
  if (tags.length > 0) {
    const taggedCards = db
      .select({ cardId: cards_tags.card_id })
      .from(cards_tags)
      .where(inArray(cards_tags.tag_id, tags));

    whereConditions.push(inArray(cards.id, taggedCards));
  }

  const matchedCards = await db.query.cards.findMany({
    where: and(...whereConditions),
    with: {
      tags: {
        with: {
          tag: true,
        },
      },
    },
    orderBy: [cards.page_id, cards.created_at],
  });

  const formattedCards = matchedCards.map((card) => ({
    ...card,
    tags: card.tags.map(({ tag }) => ({
      id: tag.id,
      name: tag.name,
      parent_id: tag.parent_id,
      created_at: tag.created_at,
      updated_at: tag.updated_at,
      deleted: tag.deleted,
      is_template: tag.is_template,
      embedding: tag.embedding ?? [],
    })),
  }));

  return formattedCards;
}
