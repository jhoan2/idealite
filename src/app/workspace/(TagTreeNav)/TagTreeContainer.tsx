// components/TagTreeContainer.tsx
"use client";

import React, { memo, useState } from "react";
import type { TreeTag } from "~/server/queries/usersTags";
import TagTreeNav from "./TagTreeNav";

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
        {/* Mobile Toggle Button */}
        <button
          className="fixed left-4 top-[30px] z-50 mr-2 md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="gray"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

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
