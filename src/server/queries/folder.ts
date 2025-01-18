import { db } from "~/server/db";
import { folders, tags, pages } from "~/server/db/schema";
import { eq, and, sql } from "drizzle-orm";

interface UserFolder {
  id: string;
  name: string;
  tag_id: string;
  tag_name: string;
  page_count: number;
  created_at: Date;
  updated_at: Date | null;
}

export async function getUserFolders(userId: string): Promise<UserFolder[]> {
  // Now check folder ownership directly
  const userFolders = await db
    .select({
      id: folders.id,
      name: folders.name,
      tag_id: folders.tag_id,
      tag_name: tags.name,
      created_at: folders.created_at,
      updated_at: folders.updated_at,
      page_count: sql<number>`count(${pages.id})::int`,
    })
    .from(folders)
    .innerJoin(tags, eq(tags.id, folders.tag_id))
    .leftJoin(pages, eq(pages.folder_id, folders.id))
    .where(
      and(
        eq(folders.user_id, userId), // Check folder ownership
        eq(tags.deleted, false),
      ),
    )
    .groupBy(
      folders.id,
      folders.name,
      folders.tag_id,
      tags.name,
      folders.created_at,
      folders.updated_at,
    )
    .orderBy(folders.created_at);

  return userFolders;
}
