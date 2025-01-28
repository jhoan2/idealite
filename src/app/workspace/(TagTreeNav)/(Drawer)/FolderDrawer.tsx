"use client";

import { useState } from "react";
import { FilePlus, Palette, FolderPlus, Trash } from "lucide-react";
import { toast } from "sonner";
import { createFolder, deleteFolder } from "~/server/actions/usersFolders";
import { Button } from "~/components/ui/button";
import { DrawerTitle } from "~/components/ui/drawer";
import { createPage } from "~/server/actions/page";
import { DrawerHeader } from "~/components/ui/drawer";
import { TreeFolder, TreeTag } from "~/server/queries/usersTags";
import {
  createUntitledPageInFolder,
  findFolderParentTag,
  generateUntitledFolderName,
} from "~/lib/tree";

export default function FolderDrawer({
  folder,
  allTags,
  onOpenChange,
}: {
  folder: TreeFolder;
  allTags: TreeTag[];
  onOpenChange: (open: boolean) => void;
}) {
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [isCreatingCanvas, setIsCreatingCanvas] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const parentTag = findFolderParentTag(allTags, folder.id);

  const handleCreatePage = async () => {
    if (!parentTag) {
      toast.error("Could not find parent tag");
      return;
    }

    try {
      setIsCreatingPage(true);
      const pageInput = createUntitledPageInFolder(
        folder,
        parentTag.id,
        allTags,
      );
      const result = await createPage(pageInput, "page");

      if (!result.success) {
        throw new Error("Failed to create page");
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating page:", error);
      toast.error("Failed to create page");
    } finally {
      setIsCreatingPage(false);
    }
  };

  const handleCreateCanvas = async () => {
    if (!parentTag) {
      toast.error("Could not find parent tag");
      return;
    }

    try {
      setIsCreatingCanvas(true);
      const pageInput = createUntitledPageInFolder(
        folder,
        parentTag.id,
        allTags,
      );
      const result = await createPage(pageInput, "canvas");

      if (!result.success) {
        throw new Error("Failed to create canvas");
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating canvas:", error);
      toast.error("Failed to create canvas");
    } finally {
      setIsCreatingCanvas(false);
    }
  };

  const handleDeleteFolder = async () => {
    if (!folder) return;

    try {
      setIsDeleting(true);
      const result = await deleteFolder({ id: folder.id });

      if (!result.success) {
        throw new Error(result.error || "Failed to delete folder");
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting folder:", error);
      toast.error("Failed to delete folder");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!parentTag) {
      toast.error("Could not find parent tag");
      return;
    }

    try {
      setIsCreatingFolder(true);
      const folderName = generateUntitledFolderName(parentTag.folders || []);

      const result = await createFolder({
        name: folderName,
        tagId: parentTag.id,
        parentFolderId: folder.id, // This makes it a subfolder of the current folder
      });

      if (!result.success) {
        throw new Error("Failed to create folder");
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.error("Failed to create folder");
    } finally {
      setIsCreatingFolder(false);
    }
  };

  return (
    <div className="p-4">
      <DrawerHeader>
        <DrawerTitle className="flex items-center">
          <FolderPlus className="mr-2 h-4 w-4" />
          {folder.name}
        </DrawerTitle>
      </DrawerHeader>
      <div className="flex flex-col space-y-2">
        <div className="h-px bg-border" />
        <Button
          variant="ghost"
          className="w-full justify-start py-6 text-sm font-normal"
          onClick={handleCreatePage}
          disabled={isCreatingPage}
        >
          <FilePlus className="mr-3 h-4 w-4" />
          <span>{isCreatingPage ? "Creating..." : "New Page"}</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start py-6 text-sm font-normal"
          onClick={handleCreateCanvas}
          disabled={isCreatingCanvas}
        >
          <Palette className="mr-3 h-4 w-4" />
          <span>{isCreatingCanvas ? "Creating..." : "New Canvas"}</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start py-6 text-sm font-normal"
          onClick={handleCreateFolder}
          disabled={isCreatingFolder}
        >
          <FolderPlus className="mr-3 h-4 w-4" />
          <span>{isCreatingFolder ? "Creating..." : "New Folder"}</span>
        </Button>
        <div className="h-px bg-border" />
        <Button
          variant="ghost"
          className="w-full justify-start py-6 text-sm font-normal text-destructive hover:text-destructive"
          onClick={handleDeleteFolder}
          disabled={isDeleting}
        >
          <Trash className="mr-3 h-4 w-4" />
          <span>{isDeleting ? "Deleting..." : "Delete Folder"}</span>
        </Button>
      </div>
    </div>
  );
}
