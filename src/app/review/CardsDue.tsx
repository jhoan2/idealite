"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Tag } from "~/server/db/schema";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Check, ChevronsUpDown, ChevronDown } from "lucide-react";
import { cn } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";
import { Card, getDueFlashCards } from "~/server/queries/card";
import { toast } from "sonner";
import FlashcardReview from "./FlashcardReview";

export default function CardsDue({ tags }: { tags: Tag[] }) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dueCardCount, setDueCardCount] = useState<number>(0);
  const [dueCards, setDueCards] = useState<Card[]>([]);
  const [selectedCount, setSelectedCount] = useState<number>(0);
  const [reviewing, setReviewing] = useState<boolean>(false);
  const [open, setOpen] = useState(false);

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
        getCards: true,
        limit: selectedCount > 0 ? selectedCount : 20,
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
  }, [selectedTags, reviewing]);

  const handleCountSelection = (percentage: number) => {
    if (percentage === 0) {
      setSelectedCount(10);
    } else {
      const count = Math.floor((dueCardCount * percentage) / 100);
      setSelectedCount(count > 0 ? count : 1);
    }
  };

  const handleReview = () => {
    setReviewing(true);
  };

  const handleReviewComplete = () => {
    setReviewing(false);
    fetchDueCardCount();
  };

  if (reviewing && dueCards.length > 0) {
    return (
      <FlashcardReview cards={dueCards} onComplete={handleReviewComplete} />
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-100px)] flex-col">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Review Cards</h1>
      <div className="flex justify-between">
        <div className="mb-2 hidden space-x-2 md:flex">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="mb-2 flex justify-between">
                Filter by Tags
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search tags..." />
                <CommandList>
                  <CommandEmpty>No tags found.</CommandEmpty>
                  <CommandGroup>
                    {tags.map((tag) => (
                      <CommandItem
                        key={tag.id}
                        value={tag.name}
                        onSelect={() => {
                          handleTagToggle(tag.id);
                          setOpen(true); // Keep the popover open
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedTags.includes(tag.id)
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {tag.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="mb-2 flex justify-between"
                disabled={dueCardCount === 0}
              >
                {selectedCount > 0 ? `${selectedCount} cards` : "How many?"}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleCountSelection(100)}>
                {Math.floor(dueCardCount)} (100%)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCountSelection(75)}>
                {Math.floor(dueCardCount * 0.75)} (75%)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCountSelection(50)}>
                {Math.floor(dueCardCount * 0.5)} (50%)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCountSelection(25)}>
                {Math.floor(dueCardCount * 0.25)} (25%)
              </DropdownMenuItem>
              {dueCardCount >= 10 && (
                <DropdownMenuItem onClick={() => handleCountSelection(10)}>
                  10 cards
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div>
          <Button onClick={handleReview}>Review</Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pb-4">
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

      <div className="mb-6 rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-2 text-xl font-semibold text-card-foreground">
          Cards Due
        </h2>
        <p className="text-3xl font-bold text-primary">{dueCardCount}</p>
      </div>

      <div className="flex-grow"></div>

      <div className="w-full pb-6 md:hidden">
        <Button
          className="w-full"
          disabled={dueCardCount === 0 || selectedCount === 0}
          onClick={handleReview}
        >
          Review
        </Button>
      </div>
    </div>
  );
}
