"use server";

import { db } from "~/server/db";
import { tags } from "~/server/db/schema";
import { sql } from "drizzle-orm";

export type SelectTag = typeof tags.$inferSelect;

export async function getTagWithChildren(tagId: string): Promise<SelectTag[]> {
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
    AND is_template = true
    ORDER BY name
  `;

  const flatTags = await db
    .execute(query)
    .then((res) => res.rows as SelectTag[]);

  const rootTag = flatTags.find((tag) => tag.id === tagId);
  if (!rootTag) throw new Error("Root tag not found");

  return flatTags;
}
