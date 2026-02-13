"use client";

import React, { useState } from "react";
import { Check, Tag } from "lucide-react";
import {
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandDialog,
} from "~/components/ui/command";
import { Button } from "~/components/ui/button";
import { DialogDescription, DialogTitle } from "~/components/ui/dialog";
import type { TreeTag } from "~/server/queries/usersTags";
import { cn } from "~/lib/utils";

interface MoveToDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: TreeTag[];
  currentTagId: string;
  onMove: (destinationTagId: string) => Promise<void>;
  isLoading: boolean;
  primaryTagId: string | null;
}

interface MoveOption {
  value: string;
  label: string;
}

function generateMoveOptions(
  tags: TreeTag[],
  currentTagId: string,
  primaryTagId: string | null,
): MoveOption[] {
  const options: MoveOption[] = [];

  function collectTags(tag: TreeTag, parentPath = "") {
    const currentPath = parentPath ? `${parentPath} / ${tag.name}` : tag.name;

    if (tag.id !== currentTagId && tag.id !== primaryTagId) {
      options.push({
        value: `tag-${tag.id}`,
        label: currentPath,
      });
    }

    if (tag.children?.length) {
      tag.children.forEach((child) => collectTags(child, currentPath));
    }
  }

  tags.forEach((tag) => collectTags(tag));

  return options.sort((a, b) => a.label.localeCompare(b.label));
}

export const MoveToDialog = ({
  open,
  onOpenChange,
  tags = [],
  currentTagId,
  onMove,
  isLoading,
  primaryTagId,
}: MoveToDialogProps) => {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const moveOptions = generateMoveOptions(tags, currentTagId, primaryTagId);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div className="flex flex-col gap-2 p-4">
        <DialogTitle>Move to Tag</DialogTitle>
        <DialogDescription>Select a destination tag.</DialogDescription>
      </div>
      <div className="grid gap-4 py-4">
        <CommandInput placeholder="Search tags..." />
        <CommandList>
          <CommandEmpty>No tag found.</CommandEmpty>
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
                <Tag className="mr-2 h-4 w-4 text-gray-400" />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </div>
      <div className="flex justify-end space-x-2 pb-4 pr-4">
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
    </CommandDialog>
  );
};
