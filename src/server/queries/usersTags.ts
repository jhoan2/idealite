import { db } from "~/server/db";
import {
  users_tags,
  tags,
  pages,
  users_pages,
  folders,
  users_folders,
} from "~/server/db/schema";
import { eq, sql, and } from "drizzle-orm";

export type SelectTag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;
export type SelectPage = typeof pages.$inferSelect;
export type InsertPage = typeof pages.$inferInsert;

export interface TreePage {
  id: string;
  title: string | null;
  primary_tag_id: string | null;
  folder_id: string | null;
  content_type: "page" | "canvas";
  archived: boolean;
}

export interface TreeFolder {
  id: string;
  name: string;
  is_collapsed: boolean;
  pages: TreePage[];
  subFolders: TreeFolder[];
  parent_folder_id: string | null;
}

export interface TreeTag {
  id: string;
  name: string;
  is_collapsed: boolean;
  is_archived: boolean;
  children: TreeTag[];
  folders: TreeFolder[];
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
  // Then ensure user has relation to root tag
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
  // 1. Get all tags the user has access to
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
    .where(
      and(
        eq(users_tags.user_id, userId),
        eq(tags.deleted, false),
        eq(users_tags.is_archived, false),
      ),
    );

  // 2. Get all folders
  const userFolders = await db
    .select({
      id: folders.id,
      name: folders.name,
      tag_id: folders.tag_id,
      is_collapsed: users_folders.is_collapsed,
      parent_folder_id: folders.parent_folder_id,
    })
    .from(folders)
    .leftJoin(
      users_folders,
      and(
        eq(users_folders.folder_id, folders.id),
        eq(users_folders.user_id, userId),
      ),
    )
    .where(eq(folders.user_id, userId));

  // 3. Get all pages
  const userPages = await db
    .select({
      id: pages.id,
      title: pages.title,
      primary_tag_id: pages.primary_tag_id,
      folder_id: pages.folder_id,
      content_type: pages.content_type,
      archived: pages.archived,
    })
    .from(pages)
    .innerJoin(users_pages, eq(users_pages.page_id, pages.id))
    .where(and(eq(users_pages.user_id, userId), eq(pages.deleted, false)));

  // Create Maps for O(1) lookups
  const foldersByTag = new Map<
    string,
    Array<{
      id: string;
      name: string;
      is_collapsed: boolean | null;
      parent_folder_id: string | null;
      pages: Array<{
        id: string;
        title: string;
        folder_id: string | null;
        primary_tag_id: string | null;
        archived: boolean;
      }>;
    }>
  >();

  const pagesByFolder = new Map<
    string,
    Array<{
      id: string;
      title: string;
      folder_id: string | null;
      primary_tag_id: string | null;
      content_type: "page" | "canvas";
      archived: boolean;
    }>
  >();

  const unfolderedPagesByTag = new Map<
    string,
    Array<{
      id: string;
      title: string;
      folder_id: string | null;
      primary_tag_id: string | null;
      content_type: "page" | "canvas";
      archived: boolean;
    }>
  >();

  // Organize pages by folder and tag
  userPages.forEach((page) => {
    if (page.folder_id) {
      if (!pagesByFolder.has(page.folder_id)) {
        pagesByFolder.set(page.folder_id, []);
      }
      pagesByFolder.get(page.folder_id)?.push({
        id: page.id,
        title: page.title,
        folder_id: page.folder_id,
        primary_tag_id: page.primary_tag_id,
        content_type: page.content_type,
        archived: page.archived ?? false,
      });
    } else if (page.primary_tag_id) {
      if (!unfolderedPagesByTag.has(page.primary_tag_id)) {
        unfolderedPagesByTag.set(page.primary_tag_id, []);
      }
      unfolderedPagesByTag.get(page.primary_tag_id)?.push({
        id: page.id,
        title: page.title,
        folder_id: page.folder_id,
        primary_tag_id: page.primary_tag_id,
        content_type: page.content_type,
        archived: page.archived ?? false,
      });
    }
  });

  // Organize folders by tag (flat structure)
  userFolders.forEach((folder) => {
    if (!foldersByTag.has(folder.tag_id)) {
      foldersByTag.set(folder.tag_id, []);
    }

    foldersByTag.get(folder.tag_id)?.push({
      id: folder.id,
      name: folder.name,
      is_collapsed: folder.is_collapsed,
      parent_folder_id: folder.parent_folder_id,
      pages: pagesByFolder.get(folder.id) || [],
    });
  });

  function buildFolderTree(
    folders: Array<{
      id: string;
      name: string;
      is_collapsed: boolean | null;
      parent_folder_id: string | null;
      pages: Array<{ id: string; title: string; archived: boolean }>;
    }>,
    parentId: string | null = null,
  ): TreeFolder[] {
    const foldersAtLevel = folders.filter(
      (folder) => folder.parent_folder_id === parentId,
    );

    return foldersAtLevel.map((folder) => ({
      id: folder.id,
      name: folder.name,
      is_collapsed: folder.is_collapsed ?? false,
      pages: folder.pages as TreePage[],
      subFolders: buildFolderTree(folders, folder.id),
      parent_folder_id: folder.parent_folder_id,
    }));
  }

  function buildTagTree(parentId: string | null): TreeTag[] {
    const directChildren = userTags.filter((tag) => tag.parent_id === parentId);

    const orphanedGroups =
      parentId === null ? findOrphanedTagGroups(userTags) : [];

    const allChildren = [...directChildren, ...orphanedGroups];

    return allChildren.map((tag) => {
      const folders = buildFolderTree(foldersByTag.get(tag.id) || []);
      const pages = unfolderedPagesByTag.get(tag.id) || [];

      return {
        id: tag.id,
        name: tag.name,
        is_collapsed: tag.is_collapsed,
        is_archived: tag.is_archived,
        children: buildTagTree(tag.id),
        folders,
        pages,
      };
    });
  }

  function findOrphanedTagGroups(tags: typeof userTags) {
    const orphans = tags.filter(
      (tag) => tag.parent_id && !tags.some((t) => t.id === tag.parent_id),
    );

    return orphans
      .filter((tag) => !orphans.some((o) => o.id === tag.parent_id))
      .map((tag) => ({
        ...tag,
        isOrphaned: true,
      }));
  }
  const result = buildTagTree(null);
  return result;
}
