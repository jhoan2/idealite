"use server";

import { cards_tags } from "~/server/db/schema";
import { db } from "~/server/db";
import { and, eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";

export async function addTagToCard(cardId: string, tagId: string) {
  const user = await currentUser();
  if (!user?.externalId) {
    throw new Error("Unauthorized");
  }

  await db.insert(cards_tags).values({
    card_id: cardId,
    tag_id: tagId,
  });

  return { success: true };
}

export async function removeTagFromCard(cardId: string, tagId: string) {
  const user = await currentUser();
  if (!user?.externalId) {
    throw new Error("Unauthorized");
  }

  await db
    .delete(cards_tags)
    .where(and(eq(cards_tags.card_id, cardId), eq(cards_tags.tag_id, tagId)));

  return { success: true };
}
