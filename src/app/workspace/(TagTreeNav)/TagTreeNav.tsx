"use client";

import React, { useRef, useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  StickyNote,
  PanelTop,
  FolderPlus,
  Archive,
  FilePlus,
  Palette,
  Tag,
  Compass,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
import type { TreeFolder, TreePage, TreeTag } from "~/server/queries/usersTags";
import {
  createTagForUser,
  toggleTagArchived,
} from "~/server/actions/usersTags";
import { createPage, movePage, createRootPage } from "~/server/actions/page";
import { createRootFolder } from "~/server/actions/usersFolders";
import { toast } from "sonner";
import { updateTagCollapsed } from "~/server/actions/usersTags";
import { usePathname, useRouter } from "next/navigation";
import { createTab } from "~/server/actions/tabs";
import { MoveToDialog } from "./MoveToDialog";
import {
  updateFolderCollapsed,
  createFolder,
} from "~/server/actions/usersFolders";
import { FolderComponent } from "./Folder";
import { PageComponent } from "./Page";
import { Button } from "~/components/ui/button";
import { Drawer, DrawerContent } from "~/components/ui/drawer";
import TagDrawer from "./(Drawer)/TagDrawer";
import FolderDrawer from "./(Drawer)/FolderDrawer";
import PageDrawer from "./(Drawer)/PageDrawer";
import { createUntitledPage, createUntitledPageInFolder } from "~/lib/tree";
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

interface DrawerState {
  isOpen: boolean;
  type: "tag" | "folder" | "page" | null;
  data: TreeTag | TreeFolder | TreePage | null;
}

interface TreeProps {
  data: TreeTag[];
}

const TreeNode: React.FC<{
  node: TreeTag;
  level: number;
  allTags: TreeTag[];
  userId: string;
  onLongPress?: (
    type: "tag" | "folder" | "page",
    data: TreeTag | TreeFolder | TreePage,
  ) => void;
  onOpenDrawer: (
    type: "tag" | "folder" | "page",
    data: TreeTag | TreeFolder | TreePage,
  ) => void;
  isMobile: boolean;
}> = ({ node, level, allTags, userId, onOpenDrawer, isMobile }) => {
  const hasChildren = node.children && node.children.length > 0;
  const hasPages = node.pages && node.pages.length > 0;
  const hasFolders = node.folders && node.folders.length > 0;
  const [isLoading, setIsLoading] = useState(false);

  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [selectedPage, setSelectedPage] = useState<{
    id: string;
    title: string;
    folder_id: string | null;
    primary_tag_id: string | null;
  } | null>(null);
  const [isExpanded, setIsExpanded] = useState(!node.is_collapsed);
  const router = useRouter();

  const pathname = usePathname();
  const currentPageId = pathname?.split("/workspace/")?.[1]?.split("?")?.[0];
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(
      node.folders?.filter((f) => !f.is_collapsed).map((f) => f.id) ?? [],
    ),
  );
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
    title: string,
  ) => {
    e.preventDefault();

    try {
      // Create new tab
      const newTab = await createTab({
        title,
        path: pageId,
      });

      if (!newTab.success) {
        throw new Error("Failed to create tab");
      }

      // Navigate to the content with type parameter
      router.push(`/workspace/${pageId}?tabId=${newTab.id}`);
    } catch (error) {
      console.error("Error creating tab:", error);
      toast.error("Failed to open item");
    }
  };

  const handleCreatePage = async (type: "page" | "canvas") => {
    try {
      setIsLoading(true);
      const pageInput = createUntitledPage(node, allTags);
      const result = await createPage(pageInput, type);

      if (!result.success) {
        throw new Error("Failed to create page");
      }
    } catch (error) {
      console.error("Error creating page:", error);
    } finally {
      setIsLoading(false);
    }
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
    if (!hasChildren && !hasPages && !hasFolders) return;

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

  const handleFolderToggle = async (folderId: string) => {
    const newExpandedState = !expandedFolders.has(folderId);

    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (newExpandedState) {
        next.add(folderId);
      } else {
        next.delete(folderId);
      }
      return next;
    });

    try {
      const result = await updateFolderCollapsed({
        folderId,
        isCollapsed: !newExpandedState,
      });

      if (!result.success) {
        toast.error("Failed to update folder state");
        // Revert the state
        setExpandedFolders((prev) => {
          const next = new Set(prev);
          if (!newExpandedState) {
            next.add(folderId);
          } else {
            next.delete(folderId);
          }
          return next;
        });
      }
    } catch (error) {
      console.error("Error updating folder state:", error);
      toast.error("Failed to update folder state");
    }
  };

  const handleCreateFolder = async () => {
    try {
      setIsLoading(true);
      const result = await createFolder({
        tagId: node.id,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to create folder");
        return;
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.error("Failed to create folder");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePageInFolder = async (
    folder: TreeFolder,
    type: "page" | "canvas",
  ) => {
    try {
      setIsLoading(true);
      const pageInput = createUntitledPageInFolder(folder, node.id, allTags);
      const result = await createPage(pageInput, type);

      if (!result.success) {
        throw new Error("Failed to create page");
      }

      // Optionally expand the folder if it's not already expanded
      if (!expandedFolders.has(folder.id)) {
        handleFolderToggle(folder.id);
      }
    } catch (error) {
      console.error("Error creating page:", error);
      toast.error("Failed to create page");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubfolder = async (parentFolder: TreeFolder) => {
    try {
      setIsLoading(true);
      const result = await createFolder({
        tagId: node.id,
        parentFolderId: parentFolder.id,
      });

      console.log(result);

      if (!result.success) {
        toast.error(result.error || "Failed to create folder");
        return;
      }

      // Expand the parent folder if it's not already expanded
      if (!expandedFolders.has(parentFolder.id)) {
        handleFolderToggle(parentFolder.id);
      }
    } catch (error) {
      console.error("Error creating subfolder:", error);
      toast.error("Failed to create folder");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMovePage = async (destinationId: string) => {
    if (!selectedPage) return;

    setIsLoading(true);
    try {
      const result = await movePage({
        pageId: selectedPage.id,
        destinationId: destinationId,
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
      // Handle both Error objects and string errors
      const errorMessage =
        error instanceof Error ? error.message : "Failed to move page";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
        currentFolderId={selectedPage?.folder_id ?? null}
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
        <ContextMenu>
          <ContextMenuTrigger>
            <div
              className={isMobile ? "touch-action-none select-none" : ""}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchMove}
            >
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

              {/* Expanded content */}
              {isExpanded && (
                <div className="ml-2">
                  {hasPages &&
                    node.pages.map((page) => (
                      <PageComponent
                        key={page.id}
                        page={{
                          id: page.id,
                          title: page.title || "",
                          folder_id: page.folder_id,
                          primary_tag_id: page.primary_tag_id,
                          content_type: page.content_type || "page",
                        }}
                        level={level}
                        currentPageId={currentPageId}
                        onMovePageClick={(pageId, title) => {
                          setSelectedPage({
                            id: pageId,
                            title,
                            folder_id: page.folder_id,
                            primary_tag_id: page.primary_tag_id,
                          });
                          setShowMoveDialog(true);
                        }}
                        handleItemClick={handleItemClick}
                        onOpenDrawer={onOpenDrawer}
                      />
                    ))}
                  {/* First render folders */}
                  {hasFolders &&
                    node.folders.map((folder) => (
                      <FolderComponent
                        key={folder.id}
                        folder={folder}
                        level={level}
                        parentTagId={node.id}
                        expandedFolders={expandedFolders}
                        handleFolderToggle={handleFolderToggle}
                        handleItemClick={handleItemClick}
                        currentPageId={currentPageId}
                        onMovePageClick={(pageId, title) => {
                          setSelectedPage({
                            id: pageId,
                            title,
                            folder_id: folder.id,
                            primary_tag_id: node.id,
                          });
                          setShowMoveDialog(true);
                        }}
                        onCreatePageInFolder={handleCreatePageInFolder}
                        onCreateSubfolder={handleCreateSubfolder}
                        isLoading={isLoading}
                        onOpenDrawer={onOpenDrawer}
                      />
                    ))}

                  {/* Finally render child tags */}
                  {hasChildren &&
                    node.children.map((child) => (
                      <TreeNode
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
            </div>
          </ContextMenuTrigger>
          {/* Context menu for tags */}
          <ContextMenuContent className="w-64">
            <ContextMenuItem
              onSelect={() => handleCreatePage("page")}
              disabled={isLoading}
              className={isLoading ? "cursor-not-allowed opacity-50" : ""}
            >
              <StickyNote className="mr-2 h-4 w-4" />
              <span>{isLoading ? "Creating..." : "Create  page"}</span>
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={() => handleCreatePage("canvas")}
              disabled={isLoading}
              className={isLoading ? "cursor-not-allowed opacity-50" : ""}
            >
              <PanelTop className="mr-2 h-4 w-4" />
              <span>{isLoading ? "Creating..." : "Create canvas"}</span>
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={() => handleCreateFolder()}
              disabled={isLoading}
            >
              <FolderPlus className="mr-2 h-4 w-4" />
              <span>Create folder</span>
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={(e) => {
                setShowDialog(true);
              }}
            >
              <Tag className="mr-2 h-4 w-4" />
              <span>Create tag</span>
            </ContextMenuItem>
            <ContextMenuItem onSelect={handleArchiveTag}>
              <Archive className="mr-2 h-4 w-4" />
              <span>Archive tag</span>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </Dialog>
    </>
  );
};

const MinimalistTree: React.FC<
  TreeProps & {
    userId: string;
    isMobile: boolean;
    onLongPress?: (
      type: "tag" | "folder" | "page",
      data: TreeTag | TreeFolder | TreePage,
    ) => void;
    onOpenDrawer: (
      type: "tag" | "folder" | "page",
      data: TreeTag | TreeFolder | TreePage,
    ) => void;
  }
> = ({ data, userId, isMobile, onLongPress, onOpenDrawer }) => {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex justify-center pt-2">
        <Button variant="ghost" size="icon" title="Global Tags">
          <Link href="/workspace/global-tags">
            <Compass className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div
        className={`custom-scrollbar ${isMobile ? "pb-36" : ""} h-screen overflow-y-auto pl-4`}
      >
        {data.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            level={0}
            allTags={data}
            userId={userId}
            onOpenDrawer={onOpenDrawer}
            isMobile={isMobile}
          />
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
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRootPage = async (type: "page" | "canvas") => {
    try {
      setIsLoading(true);
      const result = await createRootPage(type);
      if (!result.success) {
        throw new Error(result.error || "Failed to create page");
      }
    } catch (error) {
      console.error("Error creating page:", error);
      toast.error("Failed to create page");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRootFolder = async () => {
    try {
      setIsLoading(true);
      const result = await createRootFolder();
      if (!result.success) {
        throw new Error(result.error || "Failed to create folder");
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.error("Failed to create folder");
    } finally {
      setIsLoading(false);
    }
  };

  const [drawerState, setDrawerState] = useState<DrawerState>({
    isOpen: false,
    type: null,
    data: null,
  });

  // Function to open drawer from child components
  const handleOpenDrawer = (
    type: "tag" | "folder" | "page",
    data: TreeTag | TreeFolder | TreePage,
  ) => {
    setDrawerState({ isOpen: true, type, data });
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
            {drawerState.type === "folder" && (
              <FolderDrawer
                folder={drawerState.data as TreeFolder}
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
          userId={userId}
          isMobile={isMobile ? true : false}
          onOpenDrawer={handleOpenDrawer}
        />
      </div>
      {isMobile && (
        <div className="mb-4 bg-background px-4 py-3 md:hidden">
          <div className="flex w-full justify-between space-x-1">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => handleCreateRootPage("page")}
              disabled={isLoading}
            >
              <FilePlus className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => handleCreateRootPage("canvas")}
              disabled={isLoading}
            >
              <Palette className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => handleCreateRootFolder()}
              disabled={isLoading}
            >
              <FolderPlus className="h-6 w-6" />
            </Button>
            <Button variant="ghost" className="flex-1">
              {/* <Archive className="h-6 w-6" /> */}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
