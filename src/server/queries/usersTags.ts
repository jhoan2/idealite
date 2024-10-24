import { db } from "~/server/db";
import {
  users_tags,
  tags,
  pages,
  pages_tags,
  users_pages,
} from "~/server/db/schema";
import { eq, sql, and } from "drizzle-orm";

export type SelectTag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;
export type SelectPage = typeof pages.$inferSelect;
export type InsertPage = typeof pages.$inferInsert;

export interface TreePage {
  id: string;
  title: string | null;
}

// Types
export interface TreeTag {
  id: string;
  name: string;
  children: TreeTag[];
  pages: Array<{
    id: string;
    title: string;
  }>;
}

interface RawTag {
  id: string;
  name: string;
  parent_id: string | null;
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
      page_title: pages.title,
      tag_id: pages_tags.tag_id,
    })
    .from(pages)
    .innerJoin(users_pages, eq(users_pages.page_id, pages.id))
    .innerJoin(pages_tags, eq(pages_tags.page_id, pages.id))
    .where(and(eq(users_pages.user_id, userId), eq(pages.deleted, false)));

  // Helper function to find root tags
  function findRootTags(tags: RawTag[]): RawTag[] {
    const parentIds = new Set(tags.map((tag) => tag.parent_id));
    return tags.filter(
      (tag) =>
        !tags.some((otherTag) => otherTag.id === tag.parent_id) ||
        !parentIds.has(tag.parent_id),
    );
  }

  function buildTagTree(tags: RawTag[], parentId: string | null): TreeTag[] {
    const children = tags.filter((tag) => tag.parent_id === parentId);

    return children.map((tag) => ({
      id: tag.id,
      name: tag.name,
      children: buildTagTree(tags, tag.id),
      pages: userPages
        .filter((page) => page.tag_id === tag.id)
        .map(({ page_id, page_title }) => ({
          id: page_id,
          title: page_title,
        })),
    }));
  }

  // Find root tags and build tree from there
  const rootTags = findRootTags(userTags);
  const tree = rootTags.map((rootTag) => ({
    id: rootTag.id,
    name: rootTag.name,
    children: buildTagTree(userTags, rootTag.id),
    pages: userPages
      .filter((page) => page.tag_id === rootTag.id)
      .map(({ page_id, page_title }) => ({
        id: page_id,
        title: page_title,
      })),
  }));

  return tree;
}
