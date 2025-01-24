"use client";

import { useMemo } from "react";
import ExploreTagTree from "./ExploreTagTree";
import CirclePack from "./CirclePack";
import { SelectTag } from "~/server/queries/tag";
import { buildUserTagTree } from "./buildUserTagTree";
interface ExploreStateProps {
  tag: SelectTag[];
  userTags: SelectTag[];
  userId: string | null;
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

export default function ExploreState({
  tag,
  userTags,
  userId,
}: ExploreStateProps) {
  const tagTree = useMemo(() => createTagTree(tag, userTags), [tag, userTags]);

  const userTagTree = useMemo(() => buildUserTagTree(userTags), [userTags]);

  return (
    <div className="flex">
      <ExploreTagTree tagTree={userTagTree} userId={userId || ""} />
      <div className="flex-1">
        <CirclePack tagTree={tagTree[0]} />
      </div>
    </div>
  );
}
