"use client";

import { useState, useMemo } from "react";
import ExploreTagTree from "./ExploreTagTree";
import CirclePack from "./CirclePack";
import { SelectTag } from "~/server/tagQueries";
import { buildUserTagTree } from "./buildUserTagTree";

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
  const [initialUserTags] = useState<SelectTag[]>(userTags);

  const tagTree = useMemo(
    () => createTagTree(flatRootTag, flatUserTags),
    [flatRootTag, flatUserTags],
  );

  const userTagTree = useMemo(
    () => buildUserTagTree(flatUserTags),
    [flatUserTags],
  );

  const hasChanged = useMemo(() => {
    const flatUserTagSet = new Set(flatUserTags.map((tag) => tag.id));
    const initialUserTagSet = new Set(initialUserTags.map((tag) => tag.id));

    return [...flatUserTagSet].some((id) => !initialUserTagSet.has(id));
  }, [flatUserTags, initialUserTags]);

  return (
    <div className="flex">
      <ExploreTagTree
        tagTree={userTagTree}
        flatUserTags={flatUserTags}
        setFlatUserTags={setFlatUserTags}
        hasChanged={hasChanged}
      />
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
