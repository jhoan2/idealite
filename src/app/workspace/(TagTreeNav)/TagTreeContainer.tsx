// components/TagTreeContainer.tsx
"use client";

import React, { memo, useState } from "react";
import type { TreeTag } from "~/server/queries/usersTags";
import TagTreeNav from "./TagTreeNav";
import { FeatureTooltip } from "../(FeatureDiscover)/FeatureTooltip";
import { FeatureKey } from "../(FeatureDiscover)/FeatureDiscoveryContext";
import { Menu } from "lucide-react";

interface TagTreeContainerProps {
  userTagTree: TreeTag[];
  userId: string;
  isMobile: boolean;
}

export const TagTreeContainer = memo(
  ({ userTagTree, userId, isMobile }: TagTreeContainerProps) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        {/* Mobile Toggle Button with Feature Tooltip */}
        <div className="fixed left-4 top-[30px] z-50 mr-2 md:hidden">
          <FeatureTooltip
            featureKey={FeatureKey.TAG_TREE_NAVIGATION}
            title="Navigate Your Tags"
            description="Access your tag structure and pages by opening the sidebar."
            position="right"
            showPointer={true}
          >
            <button
              className="flex h-8 w-8 items-center justify-center rounded-md bg-background/50 backdrop-blur-md"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5 text-foreground" />
            </button>
          </FeatureTooltip>
        </div>

        {/* Desktop View */}
        <div className="hidden md:block">
          <TagTreeNav
            userTagTree={userTagTree}
            userId={userId}
            isMobile={isMobile}
          />
        </div>

        {/* Mobile View */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-background transition-transform duration-300 ease-in-out md:hidden ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <TagTreeNav
            userTagTree={userTagTree}
            userId={userId}
            isMobile={isMobile}
          />
        </div>

        {/* Mobile Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </>
    );
  },
);

TagTreeContainer.displayName = "TagTreeContainer";
