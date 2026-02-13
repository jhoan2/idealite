"use client";

import React, { useRef, useState, useMemo } from "react";
import { ChevronRight, ChevronDown, Archive, Tag, Compass } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
import type { TreePage, TreeTag } from "~/server/queries/usersTags";
import {
  createTagForUser,
  toggleTagArchived,
  updateTagCollapsed,
} from "~/server/actions/usersTags";
import { movePage } from "~/server/actions/page";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { MoveToDialog } from "./MoveToDialog";
import { PageComponent } from "./Page";
import { Button } from "~/components/ui/button";
import { Drawer, DrawerContent } from "~/components/ui/drawer";
import TagDrawer from "./(Drawer)/TagDrawer";
import PageDrawer from "./(Drawer)/PageDrawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import Link from "next/link";
import { FeatureTooltip } from "../(FeatureDiscover)/FeatureTooltip";
import { FeatureKey } from "../(FeatureDiscover)/FeatureDiscoveryContext";

function filterPages(pages: TreePage[], showArchived: boolean): TreePage[] {
  return pages.filter((page) => page.archived === showArchived);
}

function filterTagTree(tags: TreeTag[], showArchived: boolean): TreeTag[] {
  return tags.map((tag) => ({
    ...tag,
    pages: filterPages(tag.pages, showArchived),
    children: filterTagTree(tag.children, showArchived),
  }));
}

interface DrawerState {
  isOpen: boolean;
  type: "tag" | "page" | null;
  data: TreeTag | TreePage | null;
}

interface TreeProps {
  data: TreeTag[];
}

const TreeNode: React.FC<{
  node: TreeTag;
  level: number;
  allTags: TreeTag[];
  onOpenDrawer: (type: "tag" | "page", data: TreeTag | TreePage) => void;
  isMobile: boolean;
}> = ({ node, level, allTags, onOpenDrawer, isMobile }) => {
  const hasChildren = node.children.length > 0;
  const hasPages = node.pages.length > 0;
  const [isLoading, setIsLoading] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [selectedPage, setSelectedPage] = useState<{
    id: string;
    title: string;
    primary_tag_id: string | null;
  } | null>(null);
  const [isExpanded, setIsExpanded] = useState(!node.is_collapsed);
  const router = useRouter();

  const searchParams = useSearchParams();
  const currentPageId = searchParams.get("pageId");
  const [showDialog, setShowDialog] = useState(false);
  const [tagName, setTagName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimeout = useRef<NodeJS.Timeout>();

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    longPressTimeout.current = setTimeout(() => {
      onOpenDrawer("tag", node);
    }, 500);
  };

  const handleTouchEnd = () => {
    clearTimeout(longPressTimeout.current);
  };

  const handleTouchMove = () => {
    clearTimeout(longPressTimeout.current);
  };

  const handleItemClick = async (
    e: React.MouseEvent,
    pageId: string,
  ): Promise<void> => {
    e.preventDefault();
    router.push(`/workspace?pageId=${pageId}`);
  };

  const handleArchiveTag = async () => {
    await toggleTagArchived({ tagId: node.id, isArchived: true });
  };

  const handleCreateTag = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!tagName.trim()) {
      toast.error("Tag name cannot be empty");
      return;
    }

    try {
      setIsLoading(true);
      const result = await createTagForUser({
        name: tagName.trim(),
        parentId: node.id,
      });

      if (!result.success) {
        toast.error("Failed to create tag");
        return;
      }

      setTagName("");
      setShowDialog(false);
      toast.success("Tag created successfully");
    } catch (error) {
      console.error("Error creating tag:", error);
      toast.error("Failed to create tag");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleExpand = async () => {
    if (!hasChildren && !hasPages) return;

    const newIsExpanded = !isExpanded;
    setIsExpanded(newIsExpanded);

    try {
      const result = await updateTagCollapsed({
        tagId: node.id,
        isCollapsed: !newIsExpanded,
      });

      if (!result.success) {
        toast.error("Failed to update tag state");
        setIsExpanded(!newIsExpanded);
      }
    } catch (error) {
      console.error("Error updating tag state:", error);
      toast.error("Failed to update tag state");
      setIsExpanded(!newIsExpanded);
    }
  };

  const handleMovePage = async (destinationId: string) => {
    if (!selectedPage) return;

    setIsLoading(true);
    try {
      const result = await movePage({
        pageId: selectedPage.id,
        destinationId,
      });

      if (!result.success) {
        throw new Error(
          "error" in result ? String(result.error) : "Failed to move page",
        );
      }

      setSelectedPage(null);
      setShowMoveDialog(false);
    } catch (error) {
      console.error("Error moving page:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to move page";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const tagRow = (
    <div
      className="touch-action-none select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      <div
        className="flex cursor-pointer items-center py-1 transition-colors duration-150 ease-in-out hover:bg-gray-50 dark:hover:bg-gray-700"
        style={{ paddingLeft: `${level * 16}px` }}
        onClick={handleToggleExpand}
      >
        <button
          className="mr-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-600"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          )}
        </button>
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {node.name}
        </span>
      </div>

      {isExpanded && (
        <div className="ml-2">
          {node.pages.map((page) => (
            <PageComponent
              key={page.id}
              page={{
                id: page.id,
                title: page.title || "",
                primary_tag_id: page.primary_tag_id,
                content_type: page.content_type || "page",
                archived: page.archived,
              }}
              level={level}
              currentPageId={currentPageId ?? undefined}
              onMovePageClick={(pageId, title, primaryTagId) => {
                setSelectedPage({
                  id: pageId,
                  title,
                  primary_tag_id: primaryTagId,
                });
                setShowMoveDialog(true);
              }}
              handleItemClick={handleItemClick}
              onOpenDrawer={onOpenDrawer}
              isMobile={isMobile}
            />
          ))}
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              allTags={allTags}
              onOpenDrawer={onOpenDrawer}
              isMobile={isMobile}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <MoveToDialog
        open={showMoveDialog}
        onOpenChange={(isOpen: boolean) => {
          setShowMoveDialog(isOpen);
          if (!isOpen) {
            setSelectedPage(null);
          }
        }}
        tags={allTags}
        currentTagId={node.id}
        primaryTagId={selectedPage?.primary_tag_id ?? null}
        onMove={handleMovePage}
        isLoading={isLoading}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Tag</DialogTitle>
            <DialogDescription>
              Enter a name for your new tag. This tag will be created as a child
              of the current tag.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTag}>
            <div className="grid gap-4 py-4">
              <Input
                ref={inputRef}
                id="tagName"
                placeholder="Enter tag name"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                autoFocus
                disabled={isLoading}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  setTagName("");
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {!isMobile ? (
        <ContextMenu>
          <ContextMenuTrigger>{tagRow}</ContextMenuTrigger>
          <ContextMenuContent className="w-64">
            <ContextMenuItem onSelect={() => setShowDialog(true)}>
              <Tag className="mr-2 h-4 w-4" />
              <span>Create tag</span>
            </ContextMenuItem>
            <ContextMenuItem onSelect={handleArchiveTag}>
              <Archive className="mr-2 h-4 w-4" />
              <span>Archive tag</span>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      ) : (
        tagRow
      )}
    </>
  );
};

const MinimalistTree: React.FC<
  TreeProps & {
    isMobile: boolean;
    showArchived: boolean;
    onToggleArchived: () => void;
    onOpenDrawer: (type: "tag" | "page", data: TreeTag | TreePage) => void;
  }
> = ({ data, isMobile, showArchived, onToggleArchived, onOpenDrawer }) => {
  const filteredData = useMemo(() => {
    return filterTagTree(data, showArchived);
  }, [data, showArchived]);

  return (
    <div className="w-full max-w-md overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex justify-center pt-2">
        <FeatureTooltip
          featureKey={FeatureKey.GLOBAL_TAGS}
          title="Global Tags Management"
          description="Access and manage all your tags in one centralized place."
          position="bottom"
          showPointer={true}
        >
          <Button variant="ghost" size="icon" title="Global Tags">
            <Link href="/workspace/global-tags">
              <Compass className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant={showArchived ? "default" : "ghost"}
            size="icon"
            title={showArchived ? "Show Active Pages" : "Show Archived Pages"}
            onClick={onToggleArchived}
          >
            <Archive className="h-4 w-4" />
          </Button>
        </FeatureTooltip>
      </div>
      <div
        className={`custom-scrollbar ${isMobile ? "pb-36" : ""} h-screen overflow-y-auto pb-48 pl-4`}
      >
        {filteredData.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            {showArchived ? "No archived pages found" : "No active pages found"}
          </div>
        ) : (
          filteredData.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              level={0}
              allTags={data}
              onOpenDrawer={onOpenDrawer}
              isMobile={isMobile}
            />
          ))
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 4px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.7);
        }
        @media (prefers-color-scheme: dark) {
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(156, 163, 175, 0.3);
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: rgba(156, 163, 175, 0.5);
          }
        }
        .touch-action-none {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -webkit-tap-highlight-color: transparent;
          touch-action: none;
        }
      `}</style>
    </div>
  );
};

export default function TagTreeNav({
  userTagTree,
  userId,
  isMobile = false,
}: {
  userTagTree: TreeTag[];
  userId: string;
  isMobile: boolean;
}) {
  const [showArchived, setShowArchived] = useState(false);
  const [drawerState, setDrawerState] = useState<DrawerState>({
    isOpen: false,
    type: null,
    data: null,
  });

  const handleOpenDrawer = (
    type: "tag" | "page",
    data: TreeTag | TreePage,
  ) => {
    setDrawerState({ isOpen: true, type, data });
  };

  const handleToggleArchived = () => {
    setShowArchived(!showArchived);
  };

  return (
    <div className="flex h-screen flex-col">
      <div className="w-64 overflow-hidden border-r">
        <Drawer
          open={drawerState.isOpen}
          onOpenChange={(open) =>
            setDrawerState((prev) => ({ ...prev, isOpen: open }))
          }
        >
          <DrawerContent>
            {drawerState.type === "tag" && (
              <TagDrawer
                tag={drawerState.data as TreeTag}
                allTags={userTagTree}
                onOpenChange={(open) =>
                  setDrawerState((prev) => ({ ...prev, isOpen: open }))
                }
              />
            )}
            {drawerState.type === "page" && (
              <PageDrawer
                page={drawerState.data as TreePage}
                onOpenChange={(open) =>
                  setDrawerState((prev) => ({ ...prev, isOpen: open }))
                }
                allTags={userTagTree}
                currentTagId={
                  (drawerState.data as TreePage).primary_tag_id ||
                  userTagTree[0]?.id ||
                  ""
                }
              />
            )}
          </DrawerContent>
        </Drawer>

        <MinimalistTree
          data={userTagTree}
          isMobile={isMobile}
          showArchived={showArchived}
          onToggleArchived={handleToggleArchived}
          onOpenDrawer={handleOpenDrawer}
        />
      </div>
    </div>
  );
}
