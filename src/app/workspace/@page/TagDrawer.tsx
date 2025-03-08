"use client";

import { Tag } from "~/server/db/schema";
import { Button } from "~/components/ui/button";
import {
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
} from "~/components/ui/drawer";
import { Badge } from "~/components/ui/badge";
import { X } from "lucide-react";
import { toast } from "sonner";
import { addTagToCard, removeTagFromCard } from "~/server/actions/cardsTags";
import { addTagToPage, removeTagFromPage } from "~/server/actions/page";

interface TagDrawerProps {
  tags: Tag[];
  availableTags: Tag[];
  onOpenChange: (open: boolean) => void;
  variant?: "page" | "card";
  cardId?: string;
  currentPageId: string;
}

export function TagDrawer({
  tags,
  availableTags,
  onOpenChange,
  variant = "page",
  cardId,
  currentPageId,
}: TagDrawerProps) {
  const handleRemoveTag = async (tagId: string) => {
    try {
      if (variant === "card" && cardId) {
        await removeTagFromCard(cardId, tagId);
        toast.success("Tag removed from card");
      } else {
        await removeTagFromPage(currentPageId, tagId);
      }
    } catch (error) {
      toast.error("Failed to remove tag");
      console.error("Error removing tag:", error);
    }
  };

  const handleAddTag = async (tagId: string) => {
    try {
      if (variant === "card" && cardId) {
        await addTagToCard(cardId, tagId);
        toast.success("Tag added to card");
      } else {
        await addTagToPage(currentPageId, tagId);
      }
    } catch (error) {
      toast.error("Failed to add tag");
      console.error("Error adding tag:", error);
    }
  };

  return (
    <DrawerContent>
      <DrawerHeader>
        <h3 className="text-lg font-semibold">Manage Tags</h3>
      </DrawerHeader>
      <div className="p-4">
        <div className="mb-4">
          <h4 className="mb-2 text-sm font-medium">Current Tags</h4>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="group relative"
              >
                {tag.name}
                <button
                  onClick={() => handleRemoveTag(tag.id)}
                  className="ml-1 inline-flex"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-medium">Available Tags</h4>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <Button
                key={tag.id}
                variant="outline"
                size="sm"
                onClick={() => handleAddTag(tag.id)}
              >
                {tag.name}
              </Button>
            ))}
          </div>
        </div>
      </div>
      <DrawerFooter>
        <Button onClick={() => onOpenChange(false)}>Close</Button>
      </DrawerFooter>
    </DrawerContent>
  );
}
