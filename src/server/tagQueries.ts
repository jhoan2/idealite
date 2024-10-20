import "server-only";
import { db } from "./db";
import { tags } from "./db/schema";
import { eq, sql } from "drizzle-orm";

type SelectTag = typeof tags.$inferSelect;

export interface TreeNodeData {
  id: string;
  name: string;
  children?: TreeNodeData[];
}

export async function getTagWithChildren(tagId: string): Promise<TreeNodeData> {
  const query = sql`
    WITH RECURSIVE tag_tree AS (
      SELECT *
      FROM ${tags}
      WHERE ${tags.id} = ${tagId}
      
      UNION ALL
      
      SELECT t.*
      FROM ${tags} t
      JOIN tag_tree tt ON t.parent_id = tt.id
    )
    SELECT * FROM tag_tree
    WHERE NOT deleted
    ORDER BY name
  `;

  const flatTags = await db
    .execute(query)
    .then((res) => res.rows as SelectTag[]);

  const buildHierarchy = (
    tags: SelectTag[],
    parentId: string | null = null,
  ): TreeNodeData[] => {
    return tags
      .filter((tag) => tag.parent_id === parentId)
      .map((tag) => ({
        id: tag.id,
        name: tag.name,
        children: buildHierarchy(tags, tag.id),
      }));
  };

  const rootTag = flatTags.find((tag) => tag.id === tagId);
  if (!rootTag) throw new Error("Root tag not found");

  return {
    id: rootTag.id,
    name: rootTag.name,
    children: buildHierarchy(flatTags, tagId),
  };
}
