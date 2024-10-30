"use client";

import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { TagIcon, X } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { addTagToPage, removeTagFromPage } from "~/server/actions/page";
import { toast } from "sonner";

interface TagListProps {
  tags: Tag[];
  availableTags: Tag[];
  currentPageId: string;
}

interface Tag {
  id: string;
  name: string;
}

export function TagList({ tags, availableTags, currentPageId }: TagListProps) {
  const [badges, setBadges] = useState<Tag[]>(tags);
  const handleRemoveTag = async (pageId: string, tagId: string) => {
    try {
      await removeTagFromPage(pageId, tagId);
      setBadges((prev) => prev.filter((tag) => tag.id !== tagId));
      toast.success("Tag removed successfully");
    } catch (error) {
      toast.error("Failed to remove tag");
      console.error("Error removing tag:", error);
    }
  };

  const handleAddTag = async (pageId: string, tagId: string) => {
    try {
      await addTagToPage(pageId, tagId);
      const tagToAdd = availableTags.find((tag) => tag.id === tagId);
      if (tagToAdd) {
        setBadges((prev) => [...prev, tagToAdd]);
        toast.success("Tag added successfully");
      }
    } catch (error) {
      toast.error("Failed to add tag");
      console.error("Error adding tag:", error);
    }
  };

  return (
    <div className="mt-4 w-full max-w-2xl">
      <ContextMenu>
        <ContextMenuTrigger>
          <Card className="mt-4 w-full max-w-2xl cursor-context-menu transition-colors hover:bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TagIcon className="h-5 w-5 text-muted-foreground" />
                <div className="flex flex-wrap gap-2">
                  {badges.map((tag: Tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="group relative hover:bg-destructive hover:text-destructive-foreground"
                    >
                      {tag.name}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleRemoveTag(currentPageId, tag.id);
                        }}
                        className="ml-1 hidden group-hover:inline-flex"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </ContextMenuTrigger>

        <ContextMenuContent className="max-h-[300px] overflow-y-auto">
          {availableTags.map((tag: Tag) => (
            <ContextMenuItem
              key={tag.id}
              onClick={() => handleAddTag(currentPageId, tag.id)}
            >
              {tag.name}
            </ContextMenuItem>
          ))}
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
