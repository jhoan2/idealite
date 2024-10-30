"use client";

import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { TagIcon } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { addTagToPage } from "~/server/actions/page";

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
  return (
    <div className="mt-4 w-full max-w-2xl">
      <ContextMenu>
        <ContextMenuTrigger>
          <Card className="mt-4 w-full max-w-2xl cursor-context-menu transition-colors hover:bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TagIcon className="h-5 w-5 text-muted-foreground" />
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag: Tag) => (
                    <Badge key={tag.id} variant="secondary">
                      {tag.name}
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
              onClick={() => addTagToPage(currentPageId, tag.id)}
            >
              {tag.name}
            </ContextMenuItem>
          ))}
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
