"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Tag } from "~/server/db/schema";
import { Check, Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";
import { Card, getAllPagesWithCards, getCardsByPages } from "~/server/queries/card";
import { toast } from "sonner";
import FlashcardReview from "./FlashcardReview";
import PageCardSkeleton from "./PageCardSkeleton";

type PageWithCards = {
  id: string;
  title: string;
  content_type: "page" | "canvas";
  created_at: Date;
  cardCount: number;
};

export default function CardsDue({ tags }: { tags: Tag[] }) {
  const [allPages, setAllPages] = useState<PageWithCards[]>([]);
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [reviewCards, setReviewCards] = useState<Card[]>([]);
  const [reviewing, setReviewing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isStartingReview, setIsStartingReview] = useState<boolean>(false);

  // Load all pages with cards on mount
  useEffect(() => {
    const loadPages = async () => {
      setIsLoading(true);
      try {
        const pages = await getAllPagesWithCards();
        setAllPages(pages);
      } catch (error) {
        if (error instanceof Error) {
          toast.error(`Failed to load pages: ${error.message}`);
        } else {
          toast.error("An unknown error occurred");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadPages();
  }, []);

  const handlePageToggle = (pageId: string) => {
    setSelectedPageIds((prev) => {
      if (prev.includes(pageId)) {
        return prev.filter((id) => id !== pageId);
      } else {
        return [...prev, pageId];
      }
    });
  };

  const handleStartReview = async () => {
    if (selectedPageIds.length === 0) {
      toast.error("Please select at least one page to review");
      return;
    }

    setIsStartingReview(true);
    try {
      const cards = await getCardsByPages({
        pageIds: selectedPageIds,
        tags: [],
      });

      if (cards.length === 0) {
        toast.error("No cards found for the selected pages");
        return;
      }

      setReviewCards(cards);
      setReviewing(true);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Failed to load cards: ${error.message}`);
      } else {
        toast.error("An unknown error occurred");
      }
    } finally {
      setIsStartingReview(false);
    }
  };

  const handleReviewComplete = () => {
    setReviewing(false);
    setSelectedPageIds([]);
    toast.success("Review session completed!");
  };

  const totalCardsSelected = allPages
    .filter((page) => selectedPageIds.includes(page.id))
    .reduce((sum, page) => sum + page.cardCount, 0);

  if (reviewing && reviewCards.length > 0) {
    return (
      <FlashcardReview cards={reviewCards} onComplete={handleReviewComplete} />
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-100px)] flex-col">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Review Cards</h1>

      {/* Pages Section */}
      <div className="mb-6 flex-1 space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">
              Your Pages
            </h2>
            <p className="text-sm text-muted-foreground">
              {selectedPageIds.length > 0
                ? `${selectedPageIds.length} page${selectedPageIds.length !== 1 ? "s" : ""} selected • ${totalCardsSelected} card${totalCardsSelected !== 1 ? "s" : ""}`
                : "Click on pages to select them for review"}
            </p>
          </div>
          <Button
            onClick={handleStartReview}
            disabled={selectedPageIds.length === 0 || isStartingReview}
          >
            {isStartingReview ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Start Review"
            )}
          </Button>
        </div>

        {isLoading ? (
          <PageCardSkeleton />
        ) : allPages.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No pages with flashcards found. Create some flashcards to get
              started!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {allPages.map((page) => {
              const isSelected = selectedPageIds.includes(page.id);
              return (
                <div
                  key={page.id}
                  onClick={() => handlePageToggle(page.id)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-md border p-4 transition-all hover:border-primary/50 hover:bg-accent/50",
                    isSelected
                      ? "border-primary bg-accent"
                      : "border-border bg-background"
                  )}
                >
                  <div className="flex flex-1 items-center gap-3">
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{page.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {page.cardCount} card{page.cardCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile Start Review Button */}
      <div className="w-full pb-6 md:hidden">
        <Button
          className="w-full"
          disabled={selectedPageIds.length === 0 || isStartingReview}
          onClick={handleStartReview}
        >
          {isStartingReview ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            `Start Review (${totalCardsSelected} cards)`
          )}
        </Button>
      </div>
    </div>
  );
}
