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
}

// Types
export interface TreeTag {
  id: string;
  name: string;
  is_collapsed: boolean;
  children: TreeTag[];
  folders: Array<{
    id: string;
    name: string;
    is_collapsed: boolean;
    pages: Array<{ id: string; title: string }>;
  }>;
  pages: Array<{ id: string; title: string }>;
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

  // 2. Get all folders
  const userFolders = await db
    .select({
      id: folders.id,
      name: folders.name,
      tag_id: folders.tag_id,
      is_collapsed: users_folders.is_collapsed,
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

  // 3. Get all pages (both in folders and unfoldered)
  const userPages = await db
    .select({
      id: pages.id,
      title: pages.title,
      primary_tag_id: pages.primary_tag_id,
      folder_id: pages.folder_id,
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
      pages: Array<{ id: string; title: string }>;
    }>
  >();
  const pagesByFolder = new Map<string, Array<{ id: string; title: string }>>();
  const unfolderedPagesByTag = new Map<
    string,
    Array<{ id: string; title: string }>
  >();

  // Organize pages by folder and tag
  userPages.forEach((page) => {
    if (page.folder_id) {
      // Page is in a folder
      if (!pagesByFolder.has(page.folder_id)) {
        pagesByFolder.set(page.folder_id, []);
      }
      pagesByFolder.get(page.folder_id)?.push({
        id: page.id,
        title: page.title,
      });
    } else if (page.primary_tag_id) {
      // Unfoldered page
      if (!unfolderedPagesByTag.has(page.primary_tag_id)) {
        unfolderedPagesByTag.set(page.primary_tag_id, []);
      }
      unfolderedPagesByTag.get(page.primary_tag_id)?.push({
        id: page.id,
        title: page.title,
      });
    }
  });

  // Organize folders by tag
  userFolders.forEach((folder) => {
    if (!foldersByTag.has(folder.tag_id)) {
      foldersByTag.set(folder.tag_id, []);
    }
    foldersByTag.get(folder.tag_id)?.push({
      id: folder.id,
      name: folder.name,
      pages: pagesByFolder.get(folder.id) || [],
    });
  });

  // Create child tags map
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
    const children = childrenByParent.get(parentId) || [];

    return children.map((tag) => ({
      id: tag.id,
      name: tag.name,
      is_collapsed: tag.is_collapsed,
      children: buildTagTree(tag.id),
      folders:
        foldersByTag.get(tag.id)?.map((folder) => ({
          ...folder,
          is_collapsed:
            userFolders.find((f) => f.id === folder.id)?.is_collapsed ?? false,
        })) || [],
      pages: unfolderedPagesByTag.get(tag.id) || [],
    }));
  }

  return buildTagTree(null);
}
