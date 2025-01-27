"use client";

import { useState } from "react";
import { Archive, FilePlus, FolderPlus, Palette, Tag } from "lucide-react";
import { Button } from "~/components/ui/button";
import { DrawerTitle } from "~/components/ui/drawer";
import { DrawerHeader } from "~/components/ui/drawer";
import { TreeTag } from "~/server/queries/usersTags";
import { createPage } from "~/server/actions/page";
import { createFolder } from "~/server/actions/usersFolders";
import { toggleTagArchived } from "~/server/actions/usersTags";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Loader2 } from "lucide-react";
export default function TagDrawer({
  tag,
  allTags,
}: {
  tag: TreeTag;
  allTags: TreeTag[];
}) {
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [isCreatingCanvas, setIsCreatingCanvas] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const handleArchiveTag = async () => {
    await toggleTagArchived({ tagId: tag.id, isArchived: true });
  };

  const getTagHierarchy = (currentNode: TreeTag): string[] => {
    const hierarchy: string[] = [currentNode.id];

    const findParent = (tags: TreeTag[], targetId: string): TreeTag | null => {
      for (const tag of tags) {
        if (tag.children?.some((child: TreeTag) => child.id === targetId)) {
          return tag;
        }
        if (tag.children) {
          const found = findParent(tag.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };

    let parentTag = findParent(allTags, currentNode.id);
    while (parentTag) {
      hierarchy.unshift(parentTag.id);
      parentTag = findParent(allTags, parentTag.id);
    }

    return hierarchy;
  };

  // Helper function for creating untitled page
  const createUntitledPage = () => {
    const untitledPages = tag.pages.filter((page) =>
      page.title?.toLowerCase().startsWith("untitled"),
    );

    const newTitle =
      untitledPages.length === 0
        ? "untitled"
        : `untitled ${untitledPages.length}`;

    return {
      id: uuidv4(),
      title: newTitle,
      tag_id: tag.id,
      hierarchy: getTagHierarchy(tag),
      folder_id: null,
    };
  };

  const handleCreatePage = async () => {
    try {
      setIsCreatingPage(true);
      const pageInput = createUntitledPage();
      const result = await createPage(pageInput, "page");

      if (!result.success) {
        throw new Error("Failed to create page");
      }
    } catch (error) {
      console.error("Error creating page:", error);
      toast.error("Failed to create page");
    } finally {
      setIsCreatingPage(false);
    }
  };

  const handleCreateCanvas = async () => {
    try {
      setIsCreatingCanvas(true);
      const pageInput = createUntitledPage();
      const result = await createPage(pageInput, "canvas");

      if (!result.success) {
        throw new Error("Failed to create canvas");
      }
    } catch (error) {
      console.error("Error creating canvas:", error);
      toast.error("Failed to create canvas");
    } finally {
      setIsCreatingCanvas(false);
    }
  };

  const handleCreateFolder = async () => {
    try {
      setIsCreatingFolder(true);
      const result = await createFolder({
        tagId: tag.id,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to create folder");
        return;
      }
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
          <Tag className="mr-2 h-4 w-4" />
          {tag.name}
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
          {isCreatingPage ? (
            <Loader2 className="mr-3 h-4 w-4 animate-spin" />
          ) : (
            <FilePlus className="mr-3 h-4 w-4" />
          )}
          <span>{isCreatingPage ? "Creating page..." : "New Page"}</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start py-6 text-sm font-normal"
          onClick={handleCreateCanvas}
          disabled={isCreatingCanvas}
        >
          {isCreatingCanvas ? (
            <Loader2 className="mr-3 h-4 w-4 animate-spin" />
          ) : (
            <Palette className="mr-3 h-4 w-4" />
          )}
          <span>{isCreatingCanvas ? "Creating canvas..." : "New Canvas"}</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start py-6 text-sm font-normal"
          onClick={handleCreateFolder}
          disabled={isCreatingFolder}
        >
          {isCreatingFolder ? (
            <Loader2 className="mr-3 h-4 w-4 animate-spin" />
          ) : (
            <FolderPlus className="mr-3 h-4 w-4" />
          )}
          <span>{isCreatingFolder ? "Creating folder..." : "New folder"}</span>
        </Button>
        <div className="h-px bg-border" />
        <Button
          variant="ghost"
          className="w-full justify-start py-6 text-sm font-normal text-destructive hover:text-destructive"
          onClick={handleArchiveTag}
          disabled={isArchiving}
        >
          {isArchiving ? (
            <Loader2 className="mr-3 h-4 w-4 animate-spin" />
          ) : (
            <Archive className="mr-3 h-4 w-4" />
          )}
          <span>{isArchiving ? "Archiving..." : "Archive tag"}</span>
        </Button>
      </div>
    </div>
  );
}
