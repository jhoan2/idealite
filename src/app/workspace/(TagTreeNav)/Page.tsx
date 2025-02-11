"use client";

import React, { useRef, useState } from "react";
import { Trash, Replace, StickyNote, PanelTop, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { deletePage } from "~/server/actions/page";
import { deleteTabMatchingPageTitle } from "~/server/actions/tabs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { TreePage, TreeFolder, TreeTag } from "~/server/queries/usersTags";

interface PageComponentProps {
  page: TreePage;
  level: number;
  currentPageId: string | undefined;
  onMovePageClick: (
    pageId: string,
    title: string,
    folder_id: string | null,
    primary_tag_id: string | null,
  ) => void;
  handleItemClick: (
    e: React.MouseEvent,
    pageId: string,
    title: string,
  ) => Promise<void>;
  onOpenDrawer: (
    type: "tag" | "folder" | "page",
    data: TreeTag | TreeFolder | TreePage,
  ) => void;
}

export const PageComponent: React.FC<PageComponentProps> = ({
  page,
  level,
  currentPageId,
  onMovePageClick,
  handleItemClick,
  onOpenDrawer,
}) => {
  const router = useRouter();
  const longPressTimeout = useRef<NodeJS.Timeout>();
  const touchInteraction = useRef(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    touchInteraction.current = true;
    longPressTimeout.current = setTimeout(() => {
      onOpenDrawer("page", page);
    }, 500);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    clearTimeout(longPressTimeout.current);
    if (touchInteraction.current) {
      e.preventDefault();
      // Navigate to mobile-specific route
      router.push(`/workspace/${page.id}`);
      touchInteraction.current = false;
    }
  };

  const handleTouchMove = () => {
    clearTimeout(longPressTimeout.current);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (currentPageId !== page.id) {
      setIsNavigating(true);
    }
    if (touchInteraction.current) {
      e.preventDefault();
      return;
    }
    handleItemClick(e, page.id, page.title || "");
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className="touch-action-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
        >
          <Link
            href={`/workspace/${page.id}`}
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className={`flex cursor-pointer items-center py-1 hover:bg-gray-50 dark:hover:bg-gray-700 ${
              page.id === currentPageId
                ? "bg-gray-50/80 dark:bg-gray-700/30"
                : ""
            } touch-action-none`}
            style={{ paddingLeft: `${(level + 1) * 16}px` }}
          >
            {page.content_type === "canvas" ? (
              <PanelTop className="mr-2 h-4 w-4 text-gray-400" />
            ) : (
              <StickyNote className="mr-2 h-4 w-4 text-gray-400" />
            )}
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {page.title}
            </span>
            {isNavigating && <Loader2 className="ml-2 h-3 w-3 animate-spin" />}
          </Link>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem
          onSelect={() => {
            onMovePageClick(
              page.id,
              page.title || "",
              page.folder_id,
              page.primary_tag_id,
            );
          }}
        >
          <Replace className="mr-2 h-4 w-4" />
          <span>Move to</span>
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={async () => {
            try {
              const [pageResult, tabResult] = await Promise.all([
                deletePage({ id: page.id }),
                deleteTabMatchingPageTitle(page.title || ""),
              ]);

              if (!pageResult.success || !tabResult.success) {
                toast.error("Failed to delete page and associated tabs");
                return;
              }

              if (currentPageId && page.id === currentPageId) {
                router.push("/workspace");
              }
            } catch (error) {
              console.error("Error deleting page:", error);
            }
          }}
          className="text-red-600"
        >
          <Trash className="mr-2 h-4 w-4" />
          <span>Delete page</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
