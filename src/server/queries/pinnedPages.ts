// src/server/queries/pinnedPages.ts
"use server";

import { db } from "~/server/db";
import { users_pages, pages } from "~/server/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq, asc } from "drizzle-orm";

export type PinnedPage = {
  id: string;
  title: string;
  url: string;
  content_type: "page" | "canvas";
  pin_position: number;
};

export async function getUserPinnedPages(): Promise<PinnedPage[]> {
  const user = await currentUser();
  if (!user?.externalId) {
    return [];
  }

  const pinnedPages = await db
    .select({
      id: pages.id,
      title: pages.title,
      content_type: pages.content_type,
      pin_position: users_pages.pin_position,
    })
    .from(users_pages)
    .innerJoin(pages, eq(pages.id, users_pages.page_id))
    .where(
      and(
        eq(users_pages.user_id, user.externalId),
        eq(users_pages.is_pinned, true),
        eq(pages.deleted, false),
      ),
    )
    .orderBy(asc(users_pages.pin_position));

  return pinnedPages.map((page) => ({
    ...page,
    url: `/workspace/${page.id}`,
    pin_position: page.pin_position ?? 0,
  }));
}
