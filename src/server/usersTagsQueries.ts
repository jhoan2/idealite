import { db } from "./db";
import { users_tags, tags, pages, pages_tags, users_pages } from "./db/schema";
import { eq, sql, and } from "drizzle-orm";

export type SelectTag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;
export type SelectPage = typeof pages.$inferSelect;
export type InsertPage = typeof pages.$inferInsert;

interface TreeTag {
  id: string;
  name: string;
  children: TreeTag[];
  pages: TreePage[];
}

interface TreePage {
  id: string;
  name: string;
  title: string | null;
}

export async function getUserTags(userId: string): Promise<SelectTag[]> {
  if (!userId) return [];
  const userTagsQuery = sql`
    SELECT t.*
    FROM ${tags} t
    JOIN ${users_tags} ut ON t.id = ut.tag_id
    WHERE ut.user_id = ${userId} AND NOT t.deleted
    ORDER BY t.name
  `;

  const userTags = await db
    .execute(userTagsQuery)
    .then((res) => res.rows as SelectTag[]);

  return userTags;
}

export async function getUserTagTree(userId: string): Promise<TreeTag[]> {
  // 1. Fetch all tags for the user
  const userTags = await db
    .select({
      id: tags.id,
      name: tags.name,
      parent_id: tags.parent_id,
    })
    .from(tags)
    .innerJoin(users_tags, eq(users_tags.tag_id, tags.id))
    .where(and(eq(users_tags.user_id, userId), eq(tags.deleted, false)));

  // 2. Fetch all pages and their tag associations for this user
  const userPages = await db
    .select({
      page_id: pages.id,
      page_name: pages.name,
      page_title: pages.title,
      tag_id: pages_tags.tag_id,
    })
    .from(pages)
    .innerJoin(users_pages, eq(users_pages.page_id, pages.id))
    .innerJoin(pages_tags, eq(pages_tags.page_id, pages.id))
    .where(and(eq(users_pages.user_id, userId), eq(pages.deleted, false)));

  // 3. Build the tree structure
  function buildTagTree(parentId: string | null): TreeTag[] {
    const children = userTags.filter((tag) => tag.parent_id === parentId);

    return children.map((tag) => ({
      id: tag.id,
      name: tag.name,
      children: buildTagTree(tag.id),
      pages: userPages
        .filter((page) => page.tag_id === tag.id)
        .map(({ page_id, page_name, page_title }) => ({
          id: page_id,
          name: page_name,
          title: page_title,
        })),
    }));
  }

  // Start with root level tags (those with null parent_id)
  return buildTagTree(null);
}
