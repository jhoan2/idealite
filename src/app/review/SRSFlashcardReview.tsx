"use client";

import { useState } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Check, X, SkipForward, Loader2, Image } from "lucide-react";
import { Card as CardType } from "~/server/queries/card";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "~/components/ui/dropdown-menu";
import { Ellipsis, PauseCircle, Trash2 } from "lucide-react";
import { deleteCard, processFlashCards } from "~/server/actions/card";
import { getPageById } from "~/server/queries/page";
import { parseCardPayload, resolveCardImageSrc } from "~/lib/flashcards/cardPayload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

interface CardUpdate {
  id: string;
  status: "active" | "mastered" | "suspended";
  next_review: string | null;
  last_reviewed: string;
}

interface FlashcardReviewProps {
  cards: CardType[];
  onComplete: () => void;
}

export default function FlashcardReview({
  cards,
  onComplete,
}: FlashcardReviewProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState<CardUpdate[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPageCanvas, setShowPageCanvas] = useState(false);
  const [pageCanvas, setPageCanvas] = useState<string | null>(null);
  const [isLoadingCanvas, setIsLoadingCanvas] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const currentCard = cards[currentCardIndex];
  const isLastCard = currentCardIndex === cards.length - 1;

  // Constants for SRS algorithm
  const TWO_WEEKS = 1000 * 60 * 60 * 24 * 14; // 14 days in milliseconds
  const ONE_AND_HALF_MONTHS = 1000 * 60 * 60 * 24 * 45; // ~45 days in milliseconds

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleCardAction = async (action: "wrong" | "correct" | "skip") => {
    if (!currentCard) return;

    const now = new Date();
    const lastReviewed = currentCard.last_reviewed
      ? new Date(currentCard.last_reviewed)
      : null;
    const timeSinceLastReview = lastReviewed
      ? now.getTime() - lastReviewed.getTime()
      : null;

    // Prepare the update based on the SRS algorithm
    let updateData: CardUpdate = {
      id: currentCard.id,
      status: currentCard.status as "active" | "mastered" | "suspended",
      next_review: currentCard.next_review
        ? currentCard.next_review.toISOString()
        : null,
      last_reviewed: now.toISOString(),
    };

    // Apply SRS algorithm based on user's response
    switch (action) {
      case "wrong":
      case "skip":
        updateData.status = "active";
        updateData.next_review = new Date(
          now.getTime() + TWO_WEEKS,
        ).toISOString();
        break;

      case "correct":
        if (timeSinceLastReview && timeSinceLastReview > ONE_AND_HALF_MONTHS) {
          updateData.status = "mastered";
        } else {
          updateData.status = "active";
          const nextReviewInterval =
            timeSinceLastReview && timeSinceLastReview < TWO_WEEKS
              ? TWO_WEEKS
              : ONE_AND_HALF_MONTHS;
          updateData.next_review = new Date(
            now.getTime() + nextReviewInterval,
          ).toISOString();
        }
        break;
    }

    const allUpdates = [...pendingUpdates, updateData];

    setPendingUpdates(allUpdates);

    if (isLastCard) {
      try {
        const result = await processFlashCards(allUpdates);
        toast.success("Review session completed!");
        onComplete();
      } catch (error) {
        toast.error("Failed to save review progress");
        console.error(error);
      }
    } else {
      // Move to next card
      setCurrentCardIndex((prev) => prev + 1);
      setShowAnswer(false);
    }
  };

  const renderCardContent = () => {
    if (!currentCard) return null;
    const parsedPayload = parseCardPayload(currentCard);

    if (parsedPayload?.type === "qa") {
      return (
        <div>
          <div className="mb-6">
            <h3 className="text-xl font-semibold">{parsedPayload.payload.prompt}</h3>
          </div>

          {showAnswer && (
            <div className="mt-4 rounded-md bg-muted p-4">
              <p className="text-lg">{parsedPayload.payload.response}</p>
            </div>
          )}
        </div>
      );
    } else if (parsedPayload?.type === "cloze") {
      return (
        <div className="mb-6">
          {!showAnswer ? (
            <p className="text-lg">{parsedPayload.payload.sentence}</p>
          ) : (
            <div>
              <p className="text-lg">{parsedPayload.payload.sentence}</p>
              <div className="mt-4 rounded-md bg-muted p-4">
                <p className="font-medium">
                  Answer: {parsedPayload.payload.blanks.join(", ")}
                </p>
              </div>
            </div>
          )}
        </div>
      );
    } else if (parsedPayload?.type === "image") {
      return (
        <div className="flex flex-col items-center">
          <div className="mb-4 flex max-h-[300px] w-full justify-center">
            <img
              src={resolveCardImageSrc(parsedPayload.payload.image_url)}
              alt="Card image"
              className="max-h-[300px] rounded-md object-contain"
            />
          </div>

          {showAnswer && (
            <div className="mt-4 w-full rounded-md bg-muted p-4">
              <p className="text-lg">{parsedPayload.payload.response}</p>
            </div>
          )}

          {showPageCanvas && pageCanvas && (
            <div className="mb-4 mt-2 w-full">
              <h4 className="mb-2 text-sm text-muted-foreground">
                Page Canvas:
              </h4>
              <div className="flex max-h-[300px] w-full justify-center">
                <img
                  src={`https://idealite.xyz/${pageCanvas}`}
                  alt="Page canvas"
                  className="max-h-[300px] rounded-md border border-border object-contain"
                />
              </div>
            </div>
          )}
        </div>
      );
    } else if (currentCard.content) {
      // Fallback for content-only cards (no specific card type)
      return (
        <div>
          {!showAnswer ? (
            <p className="line-clamp-3">
              {currentCard.content.substring(0, 100)}...
            </p>
          ) : (
            <div className="mt-4 rounded-md bg-muted p-4">
              <p className="text-lg">{currentCard.content}</p>
            </div>
          )}
        </div>
      );
    }

    // Final fallback if no recognizable content
    return (
      <div className="text-center text-muted-foreground">
        <p>This card has no content to display.</p>
      </div>
    );
  };

  const fetchPageCanvas = async () => {
    if (!currentCard?.page_id) return;

    try {
      setIsLoadingCanvas(true);
      // Implement a server action to get the page data
      const page = await getPageById(currentCard.page_id);

      if (page?.canvas_image_cid) {
        setPageCanvas(page.canvas_image_cid);
        setShowPageCanvas(true);
      } else {
        toast.error("No canvas image available for this page");
      }
    } catch (error) {
      console.error("Error fetching page canvas:", error);
      toast.error("Failed to load page canvas");
    } finally {
      setIsLoadingCanvas(false);
    }
  };

  const handleSuspendCard = () => {
    if (!currentCard || isProcessing) return;
    setIsProcessing(true);

    const now = new Date();
    const updateData: CardUpdate = {
      id: currentCard.id,
      status: "suspended",
      next_review: null,
      last_reviewed: now.toISOString(),
    };

    setPendingUpdates((prev) => [...prev, updateData]);
    toast.success("Card suspended");

    // Move to next card or finish
    if (isLastCard) {
      finishReview();
    } else {
      setCurrentCardIndex((prev) => prev + 1);
      setShowAnswer(false);
      setIsProcessing(false);
    }
  };

  const handleDeleteCard = () => {
    if (!currentCard || isProcessing) return;
    setIsDeleteDialogOpen(true);
  };

  // Add a new function to perform the actual deletion when confirmed
  const confirmDelete = async () => {
    setIsProcessing(true);
    setIsDeleteDialogOpen(false);

    try {
      if (currentCard) {
        await deleteCard(currentCard.id);
        toast.success("Card deleted successfully");
      }
      // Move to next card or finish
      if (isLastCard) {
        onComplete();
      } else {
        setCurrentCardIndex((prev) => prev + 1);
        setShowAnswer(false);
      }
    } catch (error) {
      toast.error("Failed to delete card");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const finishReview = async () => {
    try {
      if (pendingUpdates.length > 0) {
        await processFlashCards(pendingUpdates);
      }
      toast.success("Review session completed!");
      onComplete();
    } catch (error) {
      toast.error("Failed to save review progress");
      console.error(error);
    }
  };

  if (!currentCard) {
    return <div>No cards to review</div>;
  }

  return (
    <div className="flex min-h-[calc(100vh-100px)] flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Card {currentCardIndex + 1} of {cards.length}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={isProcessing}
              >
                <Ellipsis className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleSuspendCard}
                disabled={isProcessing}
              >
                <PauseCircle className="mr-2 h-4 w-4" />
                Suspend Card
              </DropdownMenuItem>
              {parseCardPayload(currentCard)?.type === "image" && (
                <DropdownMenuItem
                  onClick={fetchPageCanvas}
                  disabled={isLoadingCanvas}
                >
                  <Image className="mr-2 h-4 w-4" />
                  {showPageCanvas ? "Hide Page Canvas" : "View Page Canvas"}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={handleDeleteCard}
                className="text-red-500 hover:text-red-600"
                disabled={isProcessing}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Card
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Card className="p-6 md:p-8">
          <div className="min-h-[250px]">{renderCardContent()}</div>

          {!showAnswer ? (
            <Button className="mt-4 w-full" onClick={handleShowAnswer}>
              Show Answer
            </Button>
          ) : (
            <div className="mt-6 flex justify-between gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2 border-red-500 text-red-500 hover:bg-red-500/20 hover:text-red-400"
                onClick={() => handleCardAction("wrong")}
              >
                <X className="h-5 w-5" />
                Wrong
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2 border-border text-foreground hover:bg-foreground/10"
                onClick={() => handleCardAction("skip")}
              >
                <SkipForward className="h-5 w-5" />
                Skip
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2 border-green-500 text-green-500 hover:bg-green-500/20 hover:text-green-400"
                onClick={() => handleCardAction("correct")}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-5 w-5" />
                )}
                Correct
              </Button>
            </div>
          )}
        </Card>
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Card</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this card? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
