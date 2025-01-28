"use client";

import { useState } from "react";
import { FilePlus, Palette, FolderPlus, Trash } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { DrawerTitle } from "~/components/ui/drawer";
import { createPage } from "~/server/actions/page";
import { DrawerHeader } from "~/components/ui/drawer";
import { TreeFolder, TreeTag } from "~/server/queries/usersTags";
import { createUntitledPageInFolder, findFolderParentTag } from "~/lib/tree";

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
          onClick={() => console.log("Create Folder")}
        >
          <FolderPlus className="mr-3 h-4 w-4" />
          <span>New folder</span>
        </Button>
        <div className="h-px bg-border" />
        <Button
          variant="ghost"
          className="w-full justify-start py-6 text-sm font-normal text-destructive hover:text-destructive"
          onClick={() => console.log("Delete Folder")}
        >
          <Trash className="mr-3 h-4 w-4" />
          <span>Delete Folder</span>
        </Button>
      </div>
    </div>
  );
}
