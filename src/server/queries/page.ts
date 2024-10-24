import { eq, and } from "drizzle-orm";
import { db } from "~/server/db";
import { pages, users_tags, pages_tags } from "~/server/db/schema";
import { auth } from "~/app/auth";

export async function getPageForUser(pageId: string) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("User not authenticated");
  }

  const result = await db
    .select({
      id: pages.id,
      title: pages.title,
      content: pages.content,
      created_at: pages.created_at,
      updated_at: pages.updated_at,
    })
    .from(pages)
    .innerJoin(pages_tags, eq(pages.id, pages_tags.page_id))
    .innerJoin(users_tags, eq(pages_tags.tag_id, users_tags.tag_id))
    .where(
      and(
        eq(pages.id, pageId),
        eq(users_tags.user_id, userId),
        eq(pages.deleted, false),
      ),
    )
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return result[0];
}
