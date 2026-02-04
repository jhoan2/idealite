"use client";

import { useMemo } from "react";
import GlobalTagsFlow from "../GlobalTagsFlow";
import { SelectTag } from "~/server/queries/tag";
import { createTagTree, TagNode } from "../tagUtils";

interface GlobalTagStateProps {
  tag: SelectTag[];
  userTags: SelectTag[];
  userId: string | null;
}

export default function ExploreState({ tag, userTags }: GlobalTagStateProps) {
  const tagTree = useMemo(() => createTagTree(tag, userTags), [tag, userTags]);

  return (
    <div className="flex h-screen">
      <div className="flex-1">
        <GlobalTagsFlow tagTree={tagTree} />
      </div>
    </div>
  );
}
