"use client";

import React, { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Button } from "~/components/ui/button";
import type { TreeTag } from "~/server/queries/usersTags";
import { cn } from "~/lib/utils";

export const MoveToDialog = ({
  open,
  onOpenChange,
  tags = [],
  currentTagId,
  onMove,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: TreeTag[];
  currentTagId: string;
  onMove: (destinationTagId: string) => Promise<void>;
  isLoading: boolean;
}) => {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

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

  const tagOptions = flattenTags(tags).filter(
    (tag) => tag.value !== currentTagId,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Move to Tag</DialogTitle>
          <DialogDescription>
            Select a destination tag to move the page to.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandEmpty>No tag found.</CommandEmpty>
            <CommandList>
              {tagOptions.length > 0 ? (
                <CommandGroup>
                  {tagOptions.map((tag) => (
                    <CommandItem
                      key={tag.value}
                      onSelect={() => {
                        setSelectedTag(
                          tag.value === selectedTag ? null : tag.value,
                        );
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedTag === tag.value
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      {tag.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
            </CommandList>
          </Command>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (selectedTag) {
                await onMove(selectedTag);
                onOpenChange(false);
              }
            }}
            disabled={!selectedTag || isLoading}
          >
            {isLoading ? "Moving..." : "Move"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
