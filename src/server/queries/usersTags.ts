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
  is_collapsed: boolean;
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
  // 1. Get all tags the user has access to
  const userTags = await db
    .select({
      id: tags.id,
      name: tags.name,
      parent_id: tags.parent_id,
      is_collapsed: users_tags.is_collapsed,
    })
    .from(tags)
    .innerJoin(users_tags, eq(users_tags.tag_id, tags.id))
    .where(and(eq(users_tags.user_id, userId), eq(tags.deleted, false)));

  // 2. Get all pages the user has access to
  const userPages = await db
    .select({
      id: pages.id,
      title: pages.title,
      primary_tag_id: pages.primary_tag_id,
    })
    .from(pages)
    .innerJoin(users_pages, eq(users_pages.page_id, pages.id))
    .where(and(eq(users_pages.user_id, userId), eq(pages.deleted, false)));

  // Create a Map for O(1) lookups of pages by tag
  const pagesByTag = new Map<string, Array<{ id: string; title: string }>>();
  userPages.forEach((page) => {
    if (page.primary_tag_id) {
      if (!pagesByTag.has(page.primary_tag_id)) {
        pagesByTag.set(page.primary_tag_id, []);
      }
      pagesByTag.get(page.primary_tag_id)?.push({
        id: page.id,
        title: page.title,
      });
    }
  });

  // Create a Map for O(1) lookups of child tags
  const childrenByParent = new Map<
    string | null,
    Array<{
      id: string;
      name: string;
      parent_id: string | null;
      is_collapsed: boolean;
    }>
  >();

  userTags.forEach((tag) => {
    const parentId = tag.parent_id || null;
    if (!childrenByParent.has(parentId)) {
      childrenByParent.set(parentId, []);
    }
    childrenByParent.get(parentId)?.push(tag);
  });

  function buildTagTree(parentId: string | null): TreeTag[] {
    // Get children for this parent
    const children = childrenByParent.get(parentId) || [];

    return children.map((tag) => ({
      id: tag.id,
      name: tag.name,
      // Recursively build children's subtrees
      is_collapsed: tag.is_collapsed,
      children: buildTagTree(tag.id),
      // Get pages for this tag from our Map
      pages: pagesByTag.get(tag.id) || [],
    }));
  }

  // Start with root level tags (those with no parent)
  return buildTagTree(null);
}
