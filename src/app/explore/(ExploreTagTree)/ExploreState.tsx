"use client";

import { useState } from "react";
import ExploreTagTree from "./ExploreTagTree";
import CirclePack from "./CirclePack";
import { TreeNodeData } from "~/server/tagQueries";

interface ExploreStateProps {
  tag: TreeNodeData;
}

export default function ExploreState({ tag }: ExploreStateProps) {
  return (
    <div className="flex">
      <ExploreTagTree />
      <div className="flex-1">
        <CirclePack tag={tag} />
      </div>
    </div>
  );
}
