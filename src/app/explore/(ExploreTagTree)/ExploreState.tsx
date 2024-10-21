"use client";

import { useState, useMemo } from "react";
import ExploreTagTree from "./ExploreTagTree";
import CirclePack from "./CirclePack";
import { SelectTag } from "~/server/tagQueries";
import { buildHierarchicalTree } from "./buildHierarchicalUserTagTree";

interface ExploreStateProps {
  tag: SelectTag[];
  userTags: SelectTag[];
}

interface TagNode extends SelectTag {
  children: TagNode[];
  isInBoth: boolean;
}

function createTagTree(
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

export default function ExploreState({ tag, userTags }: ExploreStateProps) {
  const [flatRootTag] = useState<SelectTag[]>(tag);
  const [flatUserTags, setFlatUserTags] = useState<SelectTag[]>(userTags);

  const tagTree = useMemo(
    () => createTagTree(flatRootTag, flatUserTags),
    [flatRootTag, flatUserTags],
  );

  const userTagTree = useMemo(
    () => buildHierarchicalTree(flatUserTags),
    [flatUserTags],
  );
  console.log(userTagTree);

  return (
    <div className="flex">
      <ExploreTagTree tagTree={userTagTree} />
      <div className="flex-1">
        <CirclePack
          tagTree={tagTree[0]}
          flatUserTags={flatUserTags}
          setFlatUserTags={setFlatUserTags}
        />
      </div>
    </div>
  );
}
