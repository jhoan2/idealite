"use client";

import { useState } from "react";
import ExploreTagTree from "./ExploreTagTree";
import CirclePack from "./CirclePack";
import { TreeNodeData } from "~/server/tagQueries";

interface ExploreStateProps {
  tag: TreeNodeData;
}

export default function ExploreState({ tag }: ExploreStateProps) {
  const [tagTree, setTagTree] = useState<TreeNodeData | undefined>();
  const [initialTagTree] = useState<TreeNodeData | undefined>();

  const hasChanges = JSON.stringify(tagTree) !== JSON.stringify(initialTagTree);

  return (
    <div className="flex">
      <ExploreTagTree
        tagTree={tagTree}
        setTagTree={setTagTree}
        hasChanges={hasChanges}
      />
      <div className="flex-1">
        <CirclePack tag={tag} tagTree={tagTree} setTagTree={setTagTree} />
      </div>
    </div>
  );
}
