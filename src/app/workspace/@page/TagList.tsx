"use client";

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
import { addTagToCard, removeTagFromCard } from "~/server/actions/cardsTags";

interface TagListProps {
  tags: Tag[];
  availableTags: Tag[];
  currentPageId: string;
  variant?: "page" | "card";
  cardId?: string;
  className?: string;
  isMobile?: boolean;
}

interface Tag {
  id: string;
  name: string;
}

export function TagList({
  tags,
  availableTags,
  currentPageId,
  variant = "page",
  cardId,
  className = "",
  isMobile = false,
}: TagListProps) {
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

  const contextMenuContent = (
    <ContextMenuContent className="max-h-[300px] overflow-y-auto">
      {availableTags.map((tag: Tag) => (
        <ContextMenuItem key={tag.id} onClick={() => void handleAddTag(tag.id)}>
          {tag.name}
        </ContextMenuItem>
      ))}
    </ContextMenuContent>
  );

  // For cards, we'll just show the tags without the container
  if (variant === "card") {
    const cardContent = (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {tags.map((tag: Tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="group relative hover:bg-destructive hover:text-destructive-foreground"
          >
            {tag.name}
            <button
              onClick={(e) => {
                e.preventDefault();
                void handleRemoveTag(tag.id);
              }}
              className="ml-1 hidden group-hover:inline-flex"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    );

    if (!isMobile) {
      return (
        <ContextMenu>
          <ContextMenuTrigger>{cardContent}</ContextMenuTrigger>
          {contextMenuContent}
        </ContextMenu>
      );
    }

    return cardContent;
  }

  // Original page variant with the card container
  const pageContent = (
    <div className={`mt-4 w-full max-w-2xl ${className}`}>
      <Card className="mt-4 w-full max-w-2xl cursor-context-menu transition-colors hover:bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <TagIcon className="h-5 w-5 text-muted-foreground" />
            <div className="flex flex-wrap gap-2">
              {tags.map((tag: Tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="group relative hover:bg-destructive hover:text-destructive-foreground"
                >
                  {tag.name}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      void handleRemoveTag(tag.id);
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
    </div>
  );

  if (!isMobile) {
    return (
      <ContextMenu>
        <ContextMenuTrigger>{pageContent}</ContextMenuTrigger>
        {contextMenuContent}
      </ContextMenu>
    );
  }

  return pageContent;
}
