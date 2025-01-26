"use client";

import React from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  Trash,
  Replace,
  StickyNote,
  PanelTop,
  FolderPlus,
} from "lucide-react";
import Link from "next/link";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
import type { TreeFolder, TreePage, TreeTag } from "~/server/queries/usersTags";
import { deleteFolder } from "~/server/actions/usersFolders";
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
}) => {
  const isFolderExpanded = expandedFolders.has(folder.id);

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div>
          <div
            className="flex cursor-pointer items-center py-1 hover:bg-gray-50 dark:hover:bg-gray-700"
            style={{ paddingLeft: `${(level + 1) * 16}px` }}
            onClick={() => handleFolderToggle(folder.id)}
          >
            <button
              className="mr-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-600"
              aria-expanded={isFolderExpanded}
              aria-label={
                isFolderExpanded ? "Collapse folder" : "Expand folder"
              }
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
                  level={level + 1} // Note the level adjustment for folder pages
                  currentPageId={currentPageId}
                  onMovePageClick={onMovePageClick}
                  handleItemClick={handleItemClick}
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
                />
              ))}
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem
          onSelect={() => onCreatePageInFolder(folder, "page")}
          disabled={isLoading}
        >
          <StickyNote className="mr-2 h-4 w-4" />
          <span>{isLoading ? "Creating..." : "Create page"}</span>
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => onCreatePageInFolder(folder, "canvas")}
          disabled={isLoading}
        >
          <PanelTop className="mr-2 h-4 w-4" />
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
    </ContextMenu>
  );
};
