// /src/app/workspace/global-tags/MobileTagNavToggle.tsx
"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import TagOnlyTreeNav from "../(TagTreeNav)/TagOnlyTreeNav";
import { TreeTag } from "~/server/queries/usersTags";

interface MobileTagNavToggleProps {
  userTagTree: TreeTag[];
  userId: string;
}

export function MobileTagNavToggle({
  userTagTree,
  userId,
}: MobileTagNavToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button - styled like SidebarTrigger */}
      <div className="fixed right-3 top-2 z-50">
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7")}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle tag navigation"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Tag Navigation</span>
        </Button>
      </div>

      {/* Overlay + TagNav */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setIsOpen(false)}
          />

          {/* Slide-in Tag Nav */}
          <div className="fixed right-0 top-0 z-50 h-full w-80 max-w-[90vw] bg-background shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="font-semibold">Tags</h3>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7")}
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close Tag Navigation</span>
              </Button>
            </div>

            <div className="h-[calc(100%-64px)] overflow-hidden">
              <TagOnlyTreeNav
                userTagTree={userTagTree}
                userId={userId}
                isMobile={true}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
