
import { SelectTag } from "~/server/queries/tag";

// Re-export for client components to avoid importing from "use server" files
export type { SelectTag };

export interface TagNode extends SelectTag {
  children: TagNode[];
  isInBoth: boolean;
}

/**
 * Constructs a hierarchical tree from a flat list of tags, marking which ones
 * exist in the user's personal tag collection.
 * 
 * @param rootTags - The pool of global tags available.
 * @param userTags - The tags the user already owns.
 * @returns An array of root nodes (usually just one for the global tree).
 */
export function createTagTree(
  rootTags: SelectTag[],
  userTags: SelectTag[],
): TagNode[] {
  const userTagSet = new Set(userTags.map((tag) => tag.id));

  function buildTree(
    tags: SelectTag[],
    parentId: string | null = null,
  ): TagNode[] {
    return tags
      .filter((tag) => tag.parent_id === parentId)
      .map((tag) => ({
        ...tag,
        children: buildTree(tags, tag.id),
        isInBoth: userTagSet.has(tag.id),
      }));
  }

  return buildTree(rootTags);
}
