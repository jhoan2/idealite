import { db } from "~/server/db";
import { users_tags, tags, pages, users_pages } from "~/server/db/schema";
import { eq, sql, and } from "drizzle-orm";

export type SelectTag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;
export type SelectPage = typeof pages.$inferSelect;
export type InsertPage = typeof pages.$inferInsert;

export interface TreePage {
  id: string;
  title: string | null;
  primary_tag_id: string | null;
  content_type: "page" | "canvas";
  archived: boolean;
}

export interface TreeTag {
  id: string;
  name: string;
  is_collapsed: boolean;
  is_archived: boolean;
  children: TreeTag[];
  pages: TreePage[];
}

export async function getUserTags(userId: string): Promise<SelectTag[]> {
  if (!userId) return [];

  const userTagsQuery = sql`
    SELECT t.*
    FROM ${tags} t
    JOIN ${users_tags} ut ON t.id = ut.tag_id
    WHERE ut.user_id = ${userId}
      AND NOT t.deleted
      AND NOT ut.is_archived
    ORDER BY t.name
  `;

  const userTags = await db
    .execute(userTagsQuery)
    .then((res) => res.rows as SelectTag[]);

  return userTags;
}

export async function ensureUserRootTag(userId: string) {
  await db
    .insert(users_tags)
    .values({
      user_id: userId,
      tag_id: process.env.ROOT_TAG_ID ?? "",
      is_archived: false,
      is_collapsed: false,
    })
    .onConflictDoNothing();
}

export async function getUserTagTree(userId: string): Promise<TreeTag[]> {
  await ensureUserRootTag(userId);

  const userTags = await db
    .select({
      id: tags.id,
      name: tags.name,
      parent_id: tags.parent_id,
      is_collapsed: users_tags.is_collapsed,
      is_archived: users_tags.is_archived,
    })
    .from(tags)
    .innerJoin(users_tags, eq(users_tags.tag_id, tags.id))
    .where(and(eq(users_tags.user_id, userId), eq(tags.deleted, false)));

  const userPages = await db
    .select({
      id: pages.id,
      title: pages.title,
      primary_tag_id: pages.primary_tag_id,
      content_type: pages.content_type,
      archived: pages.archived,
    })
    .from(pages)
    .innerJoin(users_pages, eq(users_pages.page_id, pages.id))
    .where(and(eq(users_pages.user_id, userId), eq(pages.deleted, false)));

  const pagesByTag = new Map<string, TreePage[]>();

  userPages.forEach((page) => {
    if (!page.primary_tag_id) return;

    if (!pagesByTag.has(page.primary_tag_id)) {
      pagesByTag.set(page.primary_tag_id, []);
    }

    pagesByTag.get(page.primary_tag_id)?.push({
      id: page.id,
      title: page.title,
      primary_tag_id: page.primary_tag_id,
      content_type: page.content_type,
      archived: page.archived ?? false,
    });
  });

  function findOrphanedTagGroups(items: typeof userTags) {
    const orphans = items.filter(
      (tag) => tag.parent_id && !items.some((t) => t.id === tag.parent_id),
    );

    return orphans
      .filter((tag) => !orphans.some((o) => o.id === tag.parent_id))
      .map((tag) => ({
        ...tag,
        isOrphaned: true,
      }));
  }

  function buildTagTree(parentId: string | null): TreeTag[] {
    const directChildren = userTags.filter((tag) => tag.parent_id === parentId);
    const orphanedGroups =
      parentId === null ? findOrphanedTagGroups(userTags) : [];
    const allChildren = [...directChildren, ...orphanedGroups];

    return allChildren.map((tag) => ({
      id: tag.id,
      name: tag.name,
      is_collapsed: tag.is_collapsed,
      is_archived: tag.is_archived,
      children: buildTagTree(tag.id),
      pages: pagesByTag.get(tag.id) || [],
    }));
  }

  return buildTagTree(null);
}

export async function getUserTagTreeTagsOnly(
  userId: string,
): Promise<TreeTag[]> {
  await ensureUserRootTag(userId);

  const userTags = await db
    .select({
      id: tags.id,
      name: tags.name,
      parent_id: tags.parent_id,
      is_collapsed: users_tags.is_collapsed,
      is_archived: users_tags.is_archived,
    })
    .from(tags)
    .innerJoin(users_tags, eq(users_tags.tag_id, tags.id))
    .where(and(eq(users_tags.user_id, userId), eq(tags.deleted, false)));

  function findOrphanedTagGroups(items: typeof userTags) {
    const orphans = items.filter(
      (tag) => tag.parent_id && !items.some((t) => t.id === tag.parent_id),
    );

    return orphans
      .filter((tag) => !orphans.some((o) => o.id === tag.parent_id))
      .map((tag) => ({
        ...tag,
        isOrphaned: true,
      }));
  }

  function buildTagTree(parentId: string | null): TreeTag[] {
    const directChildren = userTags.filter((tag) => tag.parent_id === parentId);
    const orphanedGroups =
      parentId === null ? findOrphanedTagGroups(userTags) : [];
    const allChildren = [...directChildren, ...orphanedGroups];

    return allChildren.map((tag) => ({
      id: tag.id,
      name: tag.name,
      is_collapsed: tag.is_collapsed,
      is_archived: tag.is_archived,
      children: buildTagTree(tag.id),
      pages: [],
    }));
  }

  return buildTagTree(null);
}
