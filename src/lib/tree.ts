import type { TreeTag } from "~/server/queries/usersTags";
import { v4 as uuidv4 } from "uuid";

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

  const getTagHierarchy = (currentNode: TreeTag): string[] => {
    const hierarchy: string[] = [currentNode.id];
    const findParent = (tags: TreeTag[], targetId: string): TreeTag | null => {
      for (const tag of tags) {
        if (tag.children?.some((child: TreeTag) => child.id === targetId)) {
          return tag;
        }
        if (tag.children) {
          const found = findParent(tag.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };

    let parentTag = findParent(allTags, currentNode.id);
    while (parentTag) {
      hierarchy.unshift(parentTag.id);
      parentTag = findParent(allTags, parentTag.id);
    }
    return hierarchy;
  };

  return {
    id: uuidv4(),
    title: newTitle,
    tag_id: node.id,
    hierarchy: getTagHierarchy(node),
    folder_id: null,
  };
};
