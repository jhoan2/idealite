import type { TreeFolder, TreeTag } from "~/server/queries/usersTags";
import { v4 as uuidv4 } from "uuid";
import { Tag } from "~/server/db/schema";

export const getCurrentTagNode = (
  tags: TreeTag[],
  targetId: string,
): TreeTag | null => {
  for (const tag of tags) {
    if (tag.id === targetId) return tag;
    if (tag.children) {
      const found = getCurrentTagNode(tag.children, targetId);
      if (found) return found;
    }
  }
  return null;
};

export const generateUntitledTitle = (
  pages: Array<{ title?: string | null }>,
) => {
  const untitledPages = pages.filter((page) =>
    page.title?.toLowerCase().startsWith("untitled"),
  );
  return untitledPages.length === 0
    ? "untitled"
    : `untitled ${untitledPages.length}`;
};

export const createUntitledPage = (node: TreeTag, allTags: TreeTag[]) => {
  const newTitle = generateUntitledTitle(node.pages);

  return {
    id: uuidv4(),
    title: newTitle,
    tag_id: node.id,
    hierarchy: getTagHierarchy(node, allTags),
    folder_id: null,
  };
};

export const findParent = (
  tags: TreeTag[],
  targetId: string,
): TreeTag | null => {
  for (const tag of tags) {
    if (tag.children?.some((child) => child.id === targetId)) return tag;
    if (tag.children) {
      const found = findParent(tag.children, targetId);
      if (found) return found;
    }
  }
  return null;
};

export const findFolderParentTag = (
  tags: TreeTag[],
  folderId: string,
): TreeTag | null => {
  for (const tag of tags) {
    // Check direct folders in the current tag
    if (
      tag.folders?.some(
        (folder) =>
          folder.id === folderId ||
          folder.subFolders?.some((subfolder) => subfolder.id === folderId),
      )
    ) {
      return tag;
    }

    // Check tags' children
    if (tag.children) {
      const found = findFolderParentTag(tag.children, folderId);
      if (found) return found;
    }
  }
  return null;
};

export const getTagHierarchy = (
  currentNode: TreeTag,
  allTags: TreeTag[],
): string[] => {
  const hierarchy: string[] = [currentNode.id];
  let parentTag = findParent(allTags, currentNode.id);

  while (parentTag) {
    hierarchy.unshift(parentTag.id);
    parentTag = findParent(allTags, parentTag.id);
  }
  return hierarchy;
};

export const generateUntitledFolderName = (folders: TreeFolder[]) => {
  const untitledFolders = folders.filter((folder) =>
    folder.name.toLowerCase().startsWith("untitled"),
  );
  return untitledFolders.length === 0
    ? "untitled"
    : `untitled ${untitledFolders.length}`;
};

export const calculateOrphanedPages = (tag: TreeTag): number => {
  let count = tag.pages.length;
  if (tag.children) {
    for (const child of tag.children) {
      count += calculateOrphanedPages(child);
    }
  }
  return count;
};

export const createUntitledPageInFolder = (
  folder: TreeFolder,
  tagId: string,
  allTags: TreeTag[],
) => {
  const newTitle = generateUntitledTitle(folder.pages);
  const currentTag = getCurrentTagNode(allTags, tagId);
  if (!currentTag) throw new Error("Tag not found");

  return {
    id: uuidv4(),
    title: newTitle,
    tag_id: tagId,
    folder_id: folder.id,
    hierarchy: getTagHierarchy(currentTag, allTags),
  };
};

export const flattenTagTree = (tree: TreeTag[], existingTags: Tag[]): Tag[] => {
  const existingTagIds = new Set(existingTags.map((tag) => tag.id));

  const flatten = (node: TreeTag): Tag[] => {
    let result: Tag[] = [];

    // Only add the current tag if it's not in existingTags
    if (!existingTagIds.has(node.id)) {
      result.push({
        id: node.id,
        name: node.name,
        parent_id: null,
        created_at: new Date(),
        updated_at: null,
        deleted: null,
      });
    }

    // Recursively flatten children
    if (node.children) {
      node.children.forEach((child) => {
        result = result.concat(flatten(child));
      });
    }

    return result;
  };

  return tree.reduce((acc, node) => acc.concat(flatten(node)), [] as Tag[]);
};
