"use client";

import { useEffect, useState } from "react";
import {
  Archive,
  FilePlus,
  FolderPlus,
  Palette,
  Tag,
  Plus,
  Check,
  X,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { DrawerTitle, DrawerHeader } from "~/components/ui/drawer";
import { Input } from "~/components/ui/input";
import { TreeTag } from "~/server/queries/usersTags";
import { createPage } from "~/server/actions/page";
import { createFolder } from "~/server/actions/usersFolders";
import {
  toggleTagArchived,
  createTagForUser,
} from "~/server/actions/usersTags";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Loader2 } from "lucide-react";

export default function TagDrawer({
  tag,
  allTags,
  onOpenChange,
}: {
  tag: TreeTag;
  allTags: TreeTag[];
  onOpenChange: (open: boolean) => void;
}) {
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [isCreatingCanvas, setIsCreatingCanvas] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isCreatingSubtag, setIsCreatingSubtag] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  // Clear state when drawer closes
  useEffect(() => {
    return () => {
      setShowNameInput(false);
      setNewTagName("");
      setIsCreatingSubtag(false);
    };
  }, []);

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

  const handleCreateSubtag = async () => {
    if (!newTagName.trim()) {
      toast.error("Tag name cannot be empty");
      return;
    }

    try {
      setIsCreatingSubtag(true);
      const result = await createTagForUser({
        name: newTagName.trim(),
        parentId: tag.id,
      });

      if (!result.success) {
        throw new Error("Failed to create tag");
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error creating tag:", error);
      toast.error("Failed to create tag");
    } finally {
      setIsCreatingSubtag(false);
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
        {!showNameInput ? (
          <Button
            variant="ghost"
            className="w-full justify-start py-6 text-sm font-normal"
            onClick={() => setShowNameInput(true)}
          >
            <Plus className="mr-3 h-4 w-4" />
            <span>Create Tag</span>
          </Button>
        ) : (
          <div className="p-2">
            <div className="flex w-5/6 items-center space-x-2">
              <Input
                autoFocus
                className="min-w-0 flex-1"
                placeholder="Enter tag name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateSubtag();
                  } else if (e.key === "Escape") {
                    setShowNameInput(false);
                    setNewTagName("");
                  }
                }}
                disabled={isCreatingSubtag}
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={handleCreateSubtag}
                disabled={isCreatingSubtag}
                className="h-8 w-8 shrink-0"
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
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
