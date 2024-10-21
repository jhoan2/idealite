import "server-only";
import { db } from "./db";
import { users_tags, tags } from "./db/schema";
import { eq, sql } from "drizzle-orm";

export interface TagHierarchy {
  id: string;
  name: string;
  children?: TagHierarchy[];
}

type SelectTag = typeof tags.$inferSelect;

export async function getUserTagHierarchy(
  userId: string,
): Promise<TagHierarchy[]> {
  // First, get all tags for the user
  const userTagsQuery = sql`
    WITH RECURSIVE user_tag_tree AS (
      SELECT t.*
      FROM ${tags} t
      JOIN ${users_tags} ut ON t.id = ut.tag_id
      WHERE ut.user_id = ${userId} AND NOT t.deleted
      
      UNION ALL
      
      SELECT t.*
      FROM ${tags} t
      JOIN user_tag_tree utt ON t.id = utt.parent_id
      WHERE NOT t.deleted
    )
    SELECT * FROM user_tag_tree
    ORDER BY name
  `;

  const userTags = await db
    .execute(userTagsQuery)
    .then((res) => res.rows as SelectTag[]);

  // Build the hierarchy
  const buildHierarchy = (parentId: string | null = null): TagHierarchy[] => {
    return userTags
      .filter((tag) => tag.parent_id === parentId)
      .map((tag) => ({
        id: tag.id,
        name: tag.name,
        children: buildHierarchy(tag.id),
      }))
      .filter(
        (tag) =>
          tag.children.length > 0 || userTags.some((ut) => ut.id === tag.id),
      );
  };

  return buildHierarchy();
}
