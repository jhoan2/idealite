"use client";

import React, { useRef, useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  Trash,
  FolderPlus,
  FilePlus,
  Palette,
  Edit3,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import type { TreeFolder, TreePage, TreeTag } from "~/server/queries/usersTags";
import { deleteFolder } from "~/server/actions/usersFolders";
import { renameFolder } from "~/server/actions/folder";
import { toast } from "sonner";
import { PageComponent } from "./Page";

interface FolderComponentProps {
  folder: TreeFolder;
  level: number;
  parentTagId: string;
  expandedFolders: Set<string>;
  handleFolderToggle: (folderId: string) => Promise<void>;
  handleItemClick: (
    e: React.MouseEvent,
    pageId: string,
    title: string,
  ) => Promise<void>;
  currentPageId: string | undefined;
  onMovePageClick: (pageId: string, title: string) => void;
  onCreatePageInFolder: (
    folder: TreeFolder,
    type: "page" | "canvas",
  ) => Promise<void>;
  onCreateSubfolder: (parentFolder: TreeFolder) => Promise<void>;
  isLoading: boolean;
  onOpenDrawer: (
    type: "tag" | "folder" | "page",
    data: TreeTag | TreeFolder | TreePage,
  ) => void;
  isMobile: boolean;
}

export const FolderComponent: React.FC<FolderComponentProps> = ({
  folder,
  level,
  parentTagId,
  expandedFolders,
  handleFolderToggle,
  handleItemClick,
  currentPageId,
  onMovePageClick,
  onCreatePageInFolder,
  onCreateSubfolder,
  isLoading,
  onOpenDrawer,
  isMobile,
}) => {
  const isFolderExpanded = expandedFolders.has(folder.id);
  const longPressTimeout = useRef<NodeJS.Timeout>();

  // Rename state
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [folderName, setFolderName] = useState(folder.name);
  const [isRenaming, setIsRenaming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    longPressTimeout.current = setTimeout(() => {
      onOpenDrawer("folder", folder);
    }, 500);
  };

  const handleTouchEnd = () => {
    clearTimeout(longPressTimeout.current);
  };

  const handleTouchMove = () => {
    clearTimeout(longPressTimeout.current);
  };

  const handleRenameFolder = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!folderName.trim()) {
      toast.error("Folder name cannot be empty");
      return;
    }

    if (folderName.trim() === folder.name) {
      setShowRenameDialog(false);
      return;
    }

    try {
      setIsRenaming(true);
      const result = await renameFolder({
        folderId: folder.id,
        newName: folderName.trim(),
      });

      if (!result.success) {
        toast.error(result.error || "Failed to rename folder");
        return;
      }

      setShowRenameDialog(false);
      toast.success("Folder renamed successfully");
    } catch (error) {
      console.error("Error renaming folder:", error);
      toast.error("Failed to rename folder");
    } finally {
      setIsRenaming(false);
    }
  };

  const content = (
    <div>
      <div
        className="flex cursor-pointer items-center py-1 hover:bg-gray-50 dark:hover:bg-gray-700"
        style={{ paddingLeft: `${(level + 1) * 16}px` }}
        onClick={() => handleFolderToggle(folder.id)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
      >
        <button
          className="mr-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-600"
          aria-expanded={isFolderExpanded}
          aria-label={isFolderExpanded ? "Collapse folder" : "Expand folder"}
        >
          {isFolderExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          )}
        </button>
        <Folder className="mr-2 h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {folder.name}
        </span>
      </div>

      {isFolderExpanded && (
        <div>
          {folder.pages.map((page) => (
            <PageComponent
              key={page.id}
              page={page}
              level={level + 1}
              currentPageId={currentPageId}
              onMovePageClick={onMovePageClick}
              handleItemClick={handleItemClick}
              onOpenDrawer={onOpenDrawer}
              isMobile={isMobile}
            />
          ))}

          {folder.subFolders?.map((subfolder) => (
            <FolderComponent
              key={subfolder.id}
              folder={subfolder}
              level={level + 1}
              parentTagId={parentTagId}
              expandedFolders={expandedFolders}
              handleFolderToggle={handleFolderToggle}
              handleItemClick={handleItemClick}
              currentPageId={currentPageId}
              onMovePageClick={onMovePageClick}
              onCreatePageInFolder={onCreatePageInFolder}
              onCreateSubfolder={onCreateSubfolder}
              isLoading={isLoading}
              onOpenDrawer={onOpenDrawer}
              isMobile={isMobile}
            />
          ))}
        </div>
      )}

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
            <DialogDescription>
              Enter a new name for this folder.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRenameFolder}>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Input
                  ref={inputRef}
                  id="folderName"
                  placeholder="Enter folder name"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="col-span-3"
                  autoFocus
                  disabled={isRenaming}
                  onFocus={(e) => e.target.select()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowRenameDialog(false);
                  setFolderName(folder.name);
                }}
                disabled={isRenaming}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isRenaming}>
                {isRenaming ? "Renaming..." : "Rename"}
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
        onSelect={() => {
          setFolderName(folder.name);
          setShowRenameDialog(true);
        }}
        disabled={isLoading}
      >
        <Edit3 className="mr-2 h-4 w-4" />
        <span>Rename folder</span>
      </ContextMenuItem>
      <ContextMenuItem
        onSelect={() => onCreatePageInFolder(folder, "page")}
        disabled={isLoading}
      >
        <FilePlus className="mr-2 h-4 w-4" />
        <span>{isLoading ? "Creating..." : "Create page"}</span>
      </ContextMenuItem>
      <ContextMenuItem
        onSelect={() => onCreatePageInFolder(folder, "canvas")}
        disabled={isLoading}
      >
        <Palette className="mr-2 h-4 w-4" />
        <span>{isLoading ? "Creating..." : "Create canvas"}</span>
      </ContextMenuItem>
      <ContextMenuItem
        onSelect={() => onCreateSubfolder(folder)}
        disabled={isLoading}
      >
        <FolderPlus className="mr-2 h-4 w-4" />
        <span>Create folder</span>
      </ContextMenuItem>
      <ContextMenuItem
        onSelect={async () => {
          try {
            const result = await deleteFolder({
              id: folder.id,
            });
            if (!result.success) {
              toast.error("Failed to delete folder");
            }
          } catch (error) {
            console.error("Error deleting folder:", error);
            toast.error("Failed to delete folder");
          }
        }}
        className="text-red-600"
      >
        <Trash className="mr-2 h-4 w-4" />
        <span>Delete folder</span>
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
