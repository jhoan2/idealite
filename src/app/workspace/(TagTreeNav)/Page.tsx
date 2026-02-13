"use client";

import React, { useRef, useState } from "react";
import {
  Trash,
  Replace,
  StickyNote,
  PanelTop,
  Loader2,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import Link from "next/link";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
import {
  deletePage,
  archivePageManually,
  unarchivePageManually,
} from "~/server/actions/page";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { TreePage, TreeTag } from "~/server/queries/usersTags";

interface PageComponentProps {
  page: TreePage;
  level: number;
  currentPageId: string | undefined;
  onMovePageClick: (
    pageId: string,
    title: string,
    primary_tag_id: string | null,
  ) => void;
  handleItemClick: (
    e: React.MouseEvent,
    pageId: string,
    title: string,
  ) => Promise<void>;
  onOpenDrawer: (type: "tag" | "page", data: TreeTag | TreePage) => void;
  isMobile: boolean;
}

export const PageComponent: React.FC<PageComponentProps> = ({
  page,
  level,
  currentPageId,
  onMovePageClick,
  handleItemClick,
  onOpenDrawer,
  isMobile,
}) => {
  const router = useRouter();
  const longPressTimeout = useRef<NodeJS.Timeout>();
  const touchInteraction = useRef(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isUnarchiving, setIsUnarchiving] = useState(false);

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
      router.push(`/workspace?pageId=${page.id}`);
      touchInteraction.current = false;
    }
  };

  const handleTouchMove = () => {
    clearTimeout(longPressTimeout.current);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (touchInteraction.current) {
      e.preventDefault();
      return;
    }
    handleItemClick(e, page.id, page.title || "");
  };

  const handleArchivePage = async () => {
    try {
      setIsArchiving(true);
      const result = await archivePageManually(page.id);

      if (!result.success) {
        throw new Error(result.error || "Failed to archive page");
      }
    } catch (error) {
      console.error("Error archiving page:", error);
      toast.error("Failed to archive page");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleUnarchivePage = async () => {
    try {
      setIsUnarchiving(true);
      const result = await unarchivePageManually(page.id);

      if (!result.success) {
        throw new Error(result.error || "Failed to unarchive page");
      }
    } catch (error) {
      console.error("Error unarchiving page:", error);
      toast.error("Failed to unarchive page");
    } finally {
      setIsUnarchiving(false);
    }
  };

  const content = (
    <div
      className="touch-action-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      <Link
        href={`/workspace?pageId=${page.id}`}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`flex cursor-pointer items-center py-1 hover:bg-gray-50 dark:hover:bg-gray-700 ${
          page.id === currentPageId ? "bg-gray-50/80 dark:bg-gray-700/30" : ""
        } touch-action-none`}
        style={{ paddingLeft: `${(level + 1) * 16}px` }}
      >
        {page.content_type === "canvas" ? (
          <PanelTop className="mr-2 h-4 w-4 flex-shrink-0 text-gray-400" />
        ) : (
          <StickyNote className="mr-2 h-4 w-4 flex-shrink-0 text-gray-400" />
        )}
        <span className="min-w-0 truncate text-sm text-gray-600 dark:text-gray-400">
          {page.title}
        </span>
      </Link>
    </div>
  );

  const contextMenuContent = (
    <ContextMenuContent className="w-64">
      <ContextMenuItem
        onSelect={() => {
          onMovePageClick(page.id, page.title || "", page.primary_tag_id);
        }}
      >
        <Replace className="mr-2 h-4 w-4" />
        <span>Move to</span>
      </ContextMenuItem>

      {page.archived ? (
        <ContextMenuItem
          onSelect={handleUnarchivePage}
          disabled={isUnarchiving}
        >
          {isUnarchiving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArchiveRestore className="mr-2 h-4 w-4" />
          )}
          <span>{isUnarchiving ? "Unarchiving..." : "Unarchive page"}</span>
        </ContextMenuItem>
      ) : (
        <ContextMenuItem onSelect={handleArchivePage} disabled={isArchiving}>
          {isArchiving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Archive className="mr-2 h-4 w-4" />
          )}
          <span>{isArchiving ? "Archiving..." : "Archive page"}</span>
        </ContextMenuItem>
      )}

      <ContextMenuItem
        onSelect={async () => {
          try {
            const pageResult = await deletePage({ id: page.id });

            if (!pageResult.success) {
              toast.error("Failed to delete page");
              return;
            }

            if (currentPageId && page.id === currentPageId) {
              router.push("/workspace");
            }
          } catch (error) {
            console.error("Error deleting page:", error);
            toast.error("Failed to delete page");
          }
        }}
        className="text-red-600"
      >
        <Trash className="mr-2 h-4 w-4" />
        <span>Delete page</span>
      </ContextMenuItem>
    </ContextMenuContent>
  );

  if (!isMobile) {
    return (
      <ContextMenu>
        <ContextMenuTrigger>{content}</ContextMenuTrigger>
        {contextMenuContent}
      </ContextMenu>
    );
  }

  return content;
};
