// src/app/workspace/(TagTreeNav)/TagOnlyTreeNav.tsx
"use client";

import React, { useRef, useState } from "react";
import { ChevronRight, ChevronDown, Archive, Plus } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
import type { TreeTag } from "~/server/queries/usersTags";
import {
  createTagForUser,
  toggleTagArchived,
} from "~/server/actions/usersTags";
import { toast } from "sonner";
import { updateTagCollapsed } from "~/server/actions/usersTags";
import { Button } from "~/components/ui/button";
import { Drawer, DrawerContent } from "~/components/ui/drawer";
import SimplifiedTagDrawer from "./(Drawer)/SimplifiedTagDrawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";

interface DrawerState {
  isOpen: boolean;
  data: TreeTag | null;
}

interface TagOnlyTreeProps {
  data: TreeTag[];
  userId: string;
  isMobile: boolean;
  onOpenDrawer: (data: TreeTag) => void;
}

const TagOnlyTreeNode: React.FC<{
  node: TreeTag;
  level: number;
  allTags: TreeTag[];
  userId: string;
  onOpenDrawer: (data: TreeTag) => void;
  isMobile: boolean;
}> = ({ node, level, allTags, userId, onOpenDrawer, isMobile }) => {
  const hasChildren = node.children && node.children.length > 0;
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!node.is_collapsed);
  const [showDialog, setShowDialog] = useState(false);
  const [tagName, setTagName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimeout = useRef<NodeJS.Timeout>();

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    longPressTimeout.current = setTimeout(() => {
      onOpenDrawer(node);
    }, 500);
  };

  const handleTouchEnd = () => {
    clearTimeout(longPressTimeout.current);
  };

  const handleTouchMove = () => {
    clearTimeout(longPressTimeout.current);
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

  const handleArchiveTag = async () => {
    await toggleTagArchived({ tagId: node.id, isArchived: true });
  };

  const handleToggleExpand = async () => {
    if (!hasChildren) return;

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

  const content = (
    <div
      className="touch-action-none select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      <div
        className="flex cursor-pointer items-center py-1 transition-colors duration-150 ease-in-out hover:bg-gray-50 dark:hover:bg-gray-700"
        style={{ paddingLeft: `${level * 1.5}px` }}
        onClick={handleToggleExpand}
      >
        {hasChildren && (
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
        )}
        {!hasChildren && <div className="mr-5 w-4" />}{" "}
        {/* Spacer for alignment */}
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {node.name}
        </span>
      </div>

      {/* Expanded content - only child tags */}
      {isExpanded && hasChildren && (
        <div className="ml-2">
          {node.children.map((child) => (
            <TagOnlyTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              allTags={allTags}
              userId={userId}
              onOpenDrawer={onOpenDrawer}
              isMobile={isMobile}
            />
          ))}
        </div>
      )}

      {/* Create Tag Dialog */}
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
              <div className="flex flex-col gap-2">
                <Input
                  ref={inputRef}
                  id="tagName"
                  placeholder="Enter tag name"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  className="col-span-3"
                  autoFocus
                  disabled={isLoading}
                />
              </div>
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
    </div>
  );

  const contextMenuContent = (
    <ContextMenuContent className="w-64">
      <ContextMenuItem
        onSelect={() => setShowDialog(true)}
        disabled={isLoading}
      >
        <Plus className="mr-2 h-4 w-4" />
        <span>Create tag</span>
      </ContextMenuItem>
      <ContextMenuItem onSelect={handleArchiveTag}>
        <Archive className="mr-2 h-4 w-4" />
        <span>Archive tag</span>
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

const TagOnlyTree: React.FC<TagOnlyTreeProps> = ({
  data,
  userId,
  isMobile,
  onOpenDrawer,
}) => {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-lg border border-gray-200 bg-white pt-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="custom-scrollbar h-screen overflow-y-auto pb-48 pl-4">
        {data.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            No tags found
          </div>
        ) : (
          data.map((node) => (
            <TagOnlyTreeNode
              key={node.id}
              node={node}
              level={0}
              allTags={data}
              userId={userId}
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

export default function TagOnlyTreeNav({
  userTagTree,
  userId,
  isMobile = false,
}: {
  userTagTree: TreeTag[];
  userId: string;
  isMobile: boolean;
}) {
  const [drawerState, setDrawerState] = useState<DrawerState>({
    isOpen: false,
    data: null,
  });

  // Function to open drawer from child components
  const handleOpenDrawer = (data: TreeTag) => {
    setDrawerState({ isOpen: true, data });
  };

  return (
    <div className="flex h-screen flex-col">
      <div className="w-full overflow-hidden border-r">
        <Drawer
          open={drawerState.isOpen}
          onOpenChange={(open) =>
            setDrawerState((prev) => ({ ...prev, isOpen: open }))
          }
        >
          <DrawerContent>
            {drawerState.data && (
              <SimplifiedTagDrawer
                tag={drawerState.data}
                allTags={userTagTree}
                onOpenChange={(open) =>
                  setDrawerState((prev) => ({ ...prev, isOpen: open }))
                }
              />
            )}
          </DrawerContent>
        </Drawer>

        <TagOnlyTree
          data={userTagTree}
          userId={userId}
          isMobile={isMobile}
          onOpenDrawer={handleOpenDrawer}
        />
      </div>
    </div>
  );
}
