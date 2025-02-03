"use server";

import { db } from "~/server/db";
import { cards, tags } from "~/server/db/schema";
import { auth } from "~/app/auth";
import { and, eq } from "drizzle-orm";

export type Card = typeof cards.$inferSelect & {
  tags: {
    id: string;
    name: string;
    parent_id: string | null;
    created_at: Date;
    updated_at: Date | null;
    deleted: boolean | null;
  }[];
};
export async function getPageCards(pageId: string): Promise<Card[]> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const pageCards = await db.query.cards.findMany({
    where: and(
      eq(cards.page_id, pageId),
      eq(cards.user_id, session.user.id),
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
    })),
  }));
}
