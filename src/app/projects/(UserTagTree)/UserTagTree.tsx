"use client";

import React, { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Trash,
  StickyNote,
  Replace,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
import type { TreeTag } from "~/server/queries/usersTags";
import { v4 as uuidv4 } from "uuid";
import { createPage, deletePage, deleteTag } from "~/server/actions/usersTags";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { MoveToDialog } from "./MoveToDialog";
import { movePagesBetweenTags } from "~/server/actions/usersTags";
import Link from "next/link";
import { updateTagCollapsed } from "~/server/actions/usersTags";
interface TreeProps {
  data: TreeTag[];
}

const createUntitledPage = (node: TreeTag) => {
  // Get all untitled pages
  const untitledPages = node.pages.filter((page) =>
    page.title.toLowerCase().startsWith("untitled"),
  );

  // Create new page title using array length
  const newTitle =
    untitledPages.length === 0
      ? "untitled"
      : `untitled ${untitledPages.length}`;

  return {
    id: uuidv4(),
    title: newTitle,
    tag_id: node.id,
  };
};

const TreeNode: React.FC<{
  node: TreeTag;
  level: number;
  allTags: TreeTag[];
}> = ({ node, level, allTags }) => {
  const hasChildren = node.children && node.children.length > 0;
  const hasPages = node.pages && node.pages.length > 0;
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [selectedPage, setSelectedPage] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isExpanded, setIsExpanded] = useState(!node.is_collapsed);

  const handleCreatePage = async () => {
    try {
      setIsLoading(true);
      const pageInput = createUntitledPage(node);
      const result = await createPage(pageInput);

      if (!result.success) {
        throw new Error("Failed to create page");
      }
    } catch (error) {
      console.error("Error creating page:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateOrphanedPages = (tag: TreeTag): number => {
    let count = tag.pages.length;
    if (tag.children) {
      for (const child of tag.children) {
        count += calculateOrphanedPages(child);
      }
    }
    return count;
  };

  const handleDeleteTag = async () => {
    setShowDeleteAlert(true);
  };

  const confirmDelete = async () => {
    try {
      const result = await deleteTag({ id: node.id });
      if (!result.success) {
        toast.error("Failed to delete tag");
        return;
      }
    } catch (error) {
      console.error("Error deleting tag:", error);
      toast.error("Failed to delete tag");
    } finally {
      setShowDeleteAlert(false);
    }
  };

  const handleMovePage = async (destinationTagId: string) => {
    if (!selectedPage) return;

    setIsLoading(true);
    try {
      const result = await movePagesBetweenTags({
        pageId: selectedPage.id,
        newTagId: destinationTagId,
      });

      if (!result.success) {
        const errorMessage =
          "error" in result ? result.error : "Failed to move page";
        throw new Error(errorMessage);
      }

      toast.success(`Successfully moved "${selectedPage.title}"`);
    } catch (error) {
      console.error("Error moving page:", error);
      toast.error("Failed to move page");
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

  return (
    <>
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {node.pages.length === 0
                ? "Are you sure you want to delete this tag?"
                : `This will archive ${calculateOrphanedPages(node)} page${
                    calculateOrphanedPages(node) === 1 ? "" : "s"
                  }.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <MoveToDialog
        open={showMoveDialog}
        onOpenChange={(isOpen) => {
          setShowMoveDialog(isOpen);
          if (!isOpen) {
            setSelectedPage(null);
          }
        }}
        tags={allTags}
        currentTagId={node.id}
        onMove={handleMovePage}
        isLoading={isLoading}
      />
      <ContextMenu>
        <ContextMenuTrigger>
          <div className="select-none">
            <div
              className={`flex cursor-pointer items-center py-1 transition-colors duration-150 ease-in-out hover:bg-gray-50 dark:hover:bg-gray-700`}
              style={{ paddingLeft: `${level * 16}px` }}
              onClick={handleToggleExpand}
            >
              {
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
              }
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {node.name}
              </span>
            </div>
            {isExpanded && (
              <div className="ml-2">
                {hasChildren &&
                  node.children!.map((child, index) => (
                    <TreeNode
                      key={child.id}
                      node={child}
                      level={level + 1}
                      allTags={allTags}
                    />
                  ))}
                {hasPages &&
                  node.pages.map((page) => (
                    <ContextMenu key={page.id}>
                      <ContextMenuTrigger>
                        <Link
                          href={`/projects/${page.id}`}
                          className="flex cursor-pointer items-center py-1 hover:bg-gray-50 dark:hover:bg-gray-700"
                          style={{ paddingLeft: `${(level + 1) * 16}px` }}
                        >
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {page.title}
                          </span>
                        </Link>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-64">
                        <ContextMenuItem
                          onSelect={() => {
                            setSelectedPage({ id: page.id, title: page.title });
                            setShowMoveDialog(true);
                          }}
                        >
                          <Replace className="mr-2 h-4 w-4" />
                          <span>Move to</span>
                        </ContextMenuItem>
                        <ContextMenuItem
                          onSelect={async () => {
                            try {
                              const result = await deletePage({ id: page.id });
                              if (!result.success) {
                                toast.error("Failed to delete page");
                                throw new Error("Failed to delete page");
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
                  ))}
              </div>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          <ContextMenuItem
            onSelect={handleCreatePage}
            disabled={isLoading}
            className={isLoading ? "cursor-not-allowed opacity-50" : ""}
          >
            <StickyNote className="mr-2 h-4 w-4" />
            <span>{isLoading ? "Creating..." : "Create  page"}</span>
          </ContextMenuItem>
          <ContextMenuItem onSelect={handleDeleteTag} className="text-red-600">
            <Trash className="mr-2 h-4 w-4" />
            <span>Delete tag</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </>
  );
};

const MinimalistTree: React.FC<TreeProps> = ({ data }) => {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="custom-scrollbar h-screen overflow-y-auto p-4">
        {data.map((node, index) => (
          <TreeNode key={index} node={node} level={0} allTags={data} />
        ))}
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
      `}</style>
    </div>
  );
};

export default function UserTagTree({
  userTagTree,
}: {
  userTagTree: TreeTag[];
}) {
  return (
    <div className="flex h-screen">
      <div className="w-64 overflow-hidden border-r">
        <MinimalistTree data={userTagTree} />
      </div>
    </div>
  );
}
