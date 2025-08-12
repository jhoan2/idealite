// src/app/workspace/(TagTreeNav)/(Drawer)/SimplifiedTagDrawer.tsx
"use client";

import { useEffect, useState } from "react";
import { Archive, Plus, Check, Tag } from "lucide-react";
import { Button } from "~/components/ui/button";
import { DrawerTitle, DrawerHeader } from "~/components/ui/drawer";
import { Input } from "~/components/ui/input";
import { TreeTag } from "~/server/queries/usersTags";
import {
  toggleTagArchived,
  createTagForUser,
} from "~/server/actions/usersTags";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function SimplifiedTagDrawer({
  tag,
  allTags,
  onOpenChange,
}: {
  tag: TreeTag;
  allTags: TreeTag[];
  onOpenChange: (open: boolean) => void;
}) {
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
    try {
      setIsArchiving(true);
      await toggleTagArchived({ tagId: tag.id, isArchived: true });
      onOpenChange(false);
    } catch (error) {
      console.error("Error archiving tag:", error);
      toast.error("Failed to archive tag");
    } finally {
      setIsArchiving(false);
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
      toast.success("Tag created successfully");
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
                {isCreatingSubtag ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}
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
