"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Tag } from "~/server/db/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Badge } from "~/components/ui/badge";
import { Card, getDueFlashCards } from "~/server/queries/card";
import { toast } from "sonner";

export default function CardsDue({ tags }: { tags: Tag[] }) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dueCardCount, setDueCardCount] = useState<number>(0);
  const [dueCards, setDueCards] = useState<Card[]>([]);

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tagId)) {
        return prev.filter((id) => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  };

  const fetchDueCardCount = async () => {
    try {
      const { count, cards } = await getDueFlashCards({
        status: "active",
        tags: selectedTags,
        getCards: false,
        limit: 20,
      });

      setDueCardCount(count);
      setDueCards(cards || []);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`${error.message}`);
      } else {
        toast.error("An unknown error occurred");
      }
    }
  };

  useEffect(() => {
    fetchDueCardCount();
  }, [selectedTags]);

  return (
    <div className="flex min-h-[calc(100vh-100px)] flex-col">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Review Cards</h1>

      <div className="mb-4 hidden md:block">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="mb-2">
              Filter by Tags
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-[300px] overflow-y-auto">
            {tags.map((tag) => (
              <DropdownMenuCheckboxItem
                key={tag.id}
                checked={selectedTags.includes(tag.id)}
                onCheckedChange={() => handleTagToggle(tag.id)}
              >
                {tag.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex flex-wrap gap-2">
          {selectedTags.length > 0 &&
            selectedTags.map((tagId) => {
              const tag = tags.find((t) => t.id === tagId);
              return (
                tag && (
                  <Badge
                    key={tagId}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {tag.name}
                    <button
                      onClick={() => handleTagToggle(tagId)}
                      className="ml-1 rounded-full hover:bg-muted"
                    >
                      ✕
                    </button>
                  </Badge>
                )
              );
            })}
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-2 text-xl font-semibold text-card-foreground">
          Cards Due Today
        </h2>
        <p className="text-3xl font-bold text-primary">{dueCardCount}</p>
      </div>

      <div className="flex-grow"></div>

      <div className="w-full pb-6 md:hidden">
        <Button className="w-full" disabled={dueCardCount === 0}>
          Start Review
        </Button>
      </div>
    </div>
  );
}
