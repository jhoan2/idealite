"use client";

import React, { useState } from "react";
import { Check, Folder, Tag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { Button } from "~/components/ui/button";
import type { TreeTag } from "~/server/queries/usersTags";
import type { TreeFolder } from "~/server/queries/usersTags";
import { cn } from "~/lib/utils";

interface MoveToDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: TreeTag[];
  currentTagId: string;
  onMove: (destinationTagId: string) => Promise<void>;
  isLoading: boolean;
  currentFolderId: string | null;
  primaryTagId: string | null;
}

export const MoveToDialog = ({
  open,
  onOpenChange,
  tags = [],
  currentTagId,
  onMove,
  isLoading,
  currentFolderId,
  primaryTagId,
}: MoveToDialogProps) => {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const flattenTags = (
    tags: TreeTag[],
    parentPath = "",
  ): { value: string; label: string }[] => {
    if (!Array.isArray(tags)) {
      console.error("Expected tags to be an array, but got:", tags);
      return []; // Return an empty array if tags is not an array
    }
    return tags.reduce((acc: { value: string; label: string }[], tag) => {
      const currentPath = parentPath ? `${parentPath} / ${tag.name}` : tag.name;
      acc.push({ value: tag.id, label: currentPath });

      if (Array.isArray(tag.children) && tag.children.length > 0) {
        acc.push(...flattenTags(tag.children, currentPath));
      }

      return acc;
    }, []);
  };

  interface MoveOption {
    value: string;
    label: string;
    type: "tag" | "folder";
  }

  function generateMoveOptions(
    tags: TreeTag[],
    currentTagId: string,
    currentFolderId: string | null,
    primaryTagId: string | null,
  ): MoveOption[] {
    const options: MoveOption[] = [];
    const tagMap = new Map<string, string>(); // id -> name

    // First collect all tags and build a map
    function collectTags(tag: TreeTag, parentPath = "") {
      const currentPath = parentPath ? `${parentPath} / ${tag.name}` : tag.name;

      if (tag.id !== currentTagId && tag.id !== primaryTagId) {
        options.push({
          value: `tag-${tag.id}`,
          label: currentPath,
          type: "tag",
        });
      }

      // Store in map for folder path building
      tagMap.set(tag.id, tag.name);

      if (tag.children) {
        tag.children.forEach((child) => collectTags(child, currentPath));
      }
    }

    // Collect all folders from a tag
    function collectFolders(tag: TreeTag) {
      if (tag.folders) {
        // Create a map of folders for easy parent lookup
        const folderMap = new Map<string, TreeFolder>();

        // First pass: collect all folders in this tag
        function mapFolders(folder: TreeFolder) {
          folderMap.set(folder.id, folder);
          if (folder.subFolders) {
            folder.subFolders.forEach(mapFolders);
          }
        }

        tag.folders.forEach(mapFolders);

        // Second pass: build paths and add options
        function buildFolderPath(folder: TreeFolder): string {
          const parts: string[] = [folder.name];
          let current = folder;

          // Build path up through parent folders
          while (
            current.parent_folder_id &&
            folderMap.has(current.parent_folder_id)
          ) {
            current = folderMap.get(current.parent_folder_id)!;
            parts.unshift(current.name);
          }

          // Add tag path
          const tagName = tagMap.get(tag.id);
          if (tagName) {
            parts.unshift(tagName);
          }

          return parts.join(" / ");
        }

        // Add folder options
        folderMap.forEach((folder) => {
          if (folder.id !== currentFolderId) {
            options.push({
              value: `folder-${folder.id}`,
              label: buildFolderPath(folder),
              type: "folder",
            });
          }
        });
      }

      // Process child tags
      if (tag.children) {
        tag.children.forEach(collectFolders);
      }
    }

    // Process all tags first to build the tag map
    tags.forEach((tag) => collectTags(tag));

    // Then collect all folders
    tags.forEach((tag) => collectFolders(tag));

    // Sort options
    return options.sort((a, b) => {
      // First sort by type (tags before folders)
      if (a.type !== b.type) {
        return a.type === "tag" ? -1 : 1;
      }
      // Then sort by label alphabetically
      return a.label.localeCompare(b.label);
    });
  }

  // Usage in component remains the same
  const moveOptions = generateMoveOptions(
    tags,
    currentTagId,
    currentFolderId,
    primaryTagId,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Move to Location</DialogTitle>
          <DialogDescription>
            Select a destination tag or folder to move the page to.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Command>
            <CommandInput placeholder="Search locations..." />
            <CommandList>
              <CommandEmpty>No location found.</CommandEmpty>
              <CommandGroup>
                {moveOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      setSelectedLocation(
                        option.value === selectedLocation ? null : option.value,
                      );
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedLocation === option.value
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {option.type === "folder" ? (
                      <Folder className="mr-2 h-4 w-4 text-gray-400" />
                    ) : (
                      <Tag className="mr-2 h-4 w-4 text-gray-400" />
                    )}
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (selectedLocation) {
                await onMove(selectedLocation);
                onOpenChange(false);
              }
            }}
            disabled={!selectedLocation || isLoading}
          >
            {isLoading ? "Moving..." : "Move"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
