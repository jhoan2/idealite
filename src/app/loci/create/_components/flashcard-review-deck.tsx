"use client";

import { useMemo, useState } from "react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

type ReviewStatus = "unanswered" | "correct" | "wrong";

interface FlashcardReviewItem {
  id: number;
  question: string;
  answer: string;
  why_testable: string;
  confidence: number;
  reviewStatus: ReviewStatus;
}

interface FlashcardReviewDeckProps {
  flashcards: FlashcardReviewItem[];
  isBusy: boolean;
  onBack: () => void;
  onFlashcardsChange: (cards: FlashcardReviewItem[]) => void;
  onDeckComplete: (cards: FlashcardReviewItem[]) => Promise<void> | void;
}

export function FlashcardReviewDeck({
  flashcards,
  isBusy,
  onBack,
  onFlashcardsChange,
  onDeckComplete,
}: FlashcardReviewDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(() =>
    findFirstUnansweredIndex(flashcards),
  );
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  const wrongCount = useMemo(
    () => flashcards.filter((card) => card.reviewStatus === "wrong").length,
    [flashcards],
  );
  const unansweredCount = useMemo(
    () => flashcards.filter((card) => card.reviewStatus === "unanswered").length,
    [flashcards],
  );
  const reviewedCount = flashcards.length - unansweredCount;
  const isDeckComplete = flashcards.length > 0 && unansweredCount === 0;
  const safeCurrentIndex = flashcards[currentIndex]
    ? currentIndex
    : findFirstUnansweredIndex(flashcards);
  const currentCard = flashcards[safeCurrentIndex];

  const handleMarkCard = async (status: "correct" | "wrong") => {
    if (!currentCard || !isAnswerRevealed || isBusy) return;

    const nextCards = flashcards.map((card, index) =>
      index === safeCurrentIndex ? { ...card, reviewStatus: status } : card,
    );
    onFlashcardsChange(nextCards);
    setIsAnswerRevealed(false);

    const nextUnansweredIndex = findNextUnansweredIndex(
      nextCards,
      safeCurrentIndex,
    );
    if (nextUnansweredIndex === -1) {
      await onDeckComplete(nextCards);
      return;
    }

    setCurrentIndex(nextUnansweredIndex);
  };

  const handleRestartReview = () => {
    if (isBusy) return;
    onFlashcardsChange(
      flashcards.map((card) => ({ ...card, reviewStatus: "unanswered" })),
    );
    setCurrentIndex(0);
    setIsAnswerRevealed(false);
  };

  if (!flashcards.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>2) Flashcard Review</CardTitle>
          <CardDescription>Generate flashcards first.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">No flashcards available.</p>
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isDeckComplete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>2) Flashcard Review</CardTitle>
          <CardDescription>Review complete.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border bg-muted/20 p-3 text-sm">
            <p>Reviewed: {reviewedCount}</p>
            <p>Wrong: {wrongCount}</p>
          </div>
          {wrongCount === 0 ? (
            <p className="text-sm text-muted-foreground">
              All cards were marked correct. Mark at least one wrong card to build
              sticker candidates.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Wrong cards are ready for sticker generation.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button
              variant="outline"
              onClick={handleRestartReview}
              disabled={isBusy}
            >
              Review Again
            </Button>
            {wrongCount > 0 && (
              <Button
                onClick={() => void onDeckComplete(flashcards)}
                disabled={isBusy}
              >
                {isBusy ? "Preparing..." : `Build Stickers (${wrongCount})`}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>2) Flashcard Review</CardTitle>
        <CardDescription>
          Reveal the answer, then mark each card as correct or wrong.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant="outline">
            Card {safeCurrentIndex + 1} of {flashcards.length}
          </Badge>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {(currentCard.confidence * 100).toFixed(0)}%
            </Badge>
            <Badge variant="outline">Wrong {wrongCount}</Badge>
            <Badge variant="outline">Left {unansweredCount}</Badge>
          </div>
        </div>

        <div className="rounded-md border p-4">
          <p className="text-sm font-medium">{currentCard.question}</p>
          {isAnswerRevealed ? (
            <p className="mt-3 text-sm text-muted-foreground">{currentCard.answer}</p>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Answer hidden. Reveal to grade this card.
            </p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            {currentCard.why_testable}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          {!isAnswerRevealed ? (
            <Button onClick={() => setIsAnswerRevealed(true)} disabled={isBusy}>
              Reveal Answer
            </Button>
          ) : (
            <>
              <Button
                variant="destructive"
                onClick={() => void handleMarkCard("wrong")}
                disabled={isBusy}
              >
                Wrong
              </Button>
              <Button
                onClick={() => void handleMarkCard("correct")}
                disabled={isBusy}
              >
                Correct
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function findFirstUnansweredIndex(cards: FlashcardReviewItem[]): number {
  if (!cards.length) return 0;
  const firstUnanswered = cards.findIndex(
    (card) => card.reviewStatus === "unanswered",
  );
  return firstUnanswered === -1 ? 0 : firstUnanswered;
}

function findNextUnansweredIndex(
  cards: FlashcardReviewItem[],
  fromIndex: number,
): number {
  for (let index = fromIndex + 1; index < cards.length; index += 1) {
    if (cards[index]?.reviewStatus === "unanswered") return index;
  }

  for (let index = 0; index <= fromIndex; index += 1) {
    if (cards[index]?.reviewStatus === "unanswered") return index;
  }

  return -1;
}
