"use client";

import { useState } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  PauseCircle,
  X,
  Check,
  SkipForward,
  FileText,
  Ellipsis,
} from "lucide-react";
import { DropdownMenu } from "~/components/ui/dropdown-menu";
import {
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { DropdownMenuItem } from "~/components/ui/dropdown-menu";
import { CardSchema } from "~/app/api/flashcards/route";
import CardsDone from "./CardsDone";
interface FlashCard extends CardSchema {
  question: string;
  answer: string;
}

export interface CardUpdate {
  id: string;
  status: "active" | "mastered" | "suspended";
  next_review: string | null;
  last_reviewed: string;
}

export default function FlashCards({
  flashcards,
  userPlayStats,
}: {
  flashcards: FlashCard[];
  userPlayStats: { points: number; cash: number };
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isViewingOriginal, setIsViewingOriginal] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState<Array<CardUpdate>>([]);
  const [cashEarned, setCashEarned] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [rewards, setRewards] = useState<
    Array<{
      id: number;
      value: number;
      position: { x: number; y: number };
    }>
  >([]);

  const TWO_WEEKS = 1000 * 60 * 60 * 24 * 14; // 14 days in milliseconds
  const ONE_AND_HALF_MONTHS = 1000 * 60 * 60 * 24 * 45; // ~45 days in milliseconds

  const handleShowAnswer = () => {
    setIsFlipped(true);
  };

  const showReward = (value: number, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();

    const newReward = {
      id: Date.now(),
      value,
      position: { x: rect.left, y: rect.top },
    };

    setRewards((prev) => [...prev, newReward]);

    // Remove the reward after animation
    setTimeout(() => {
      setRewards((prev) => prev.filter((reward) => reward.id !== newReward.id));
    }, 1000);
  };

  const handleCardAction = async (
    action: "suspend" | "wrong" | "correct" | "skip",
  ) => {
    const currentCard = flashcards[currentIndex];
    if (!currentCard) return;

    const now = new Date();
    const lastReviewed = currentCard.last_reviewed
      ? new Date(currentCard.last_reviewed)
      : null;
    const timeSinceLastReview = lastReviewed
      ? now.getTime() - lastReviewed.getTime()
      : null;

    let updateData: CardUpdate = {
      id: currentCard.id,
      status: currentCard.status as "active" | "mastered" | "suspended",
      next_review: currentCard.next_review,
      last_reviewed: now.toISOString(),
    };

    // Calculate update based on action
    switch (action) {
      case "suspend":
        updateData.status = "suspended";
        break;

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
          setCashEarned((prev) => prev + 5);
          const cashElement = document.querySelector("[data-cash-counter]");
          if (cashElement) {
            showReward(5, cashElement as HTMLElement);
          }
        } else {
          updateData.status = "active";
          const nextReviewInterval =
            timeSinceLastReview && timeSinceLastReview < TWO_WEEKS
              ? TWO_WEEKS
              : ONE_AND_HALF_MONTHS;
          updateData.next_review = new Date(
            now.getTime() + nextReviewInterval,
          ).toISOString();
          setCashEarned((prev) => prev + 1);
          const cashElement = document.querySelector("[data-cash-counter]");
          if (cashElement) {
            showReward(1, cashElement as HTMLElement);
          }
        }
        break;
    }

    setPendingUpdates((prev) => [...prev, updateData]);

    if (currentIndex + 1 >= flashcards.length) {
      setIsDone(true);
    }
    setCurrentIndex((prev) => prev + 1);
    setIsFlipped(false);
  };

  if (isDone) {
    return (
      <CardsDone
        cashEarned={cashEarned}
        pendingUpdates={pendingUpdates}
        setPendingUpdates={setPendingUpdates}
        setCashEarned={setCashEarned}
      />
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      {/* Floating Rewards */}
      {rewards.map((reward) => (
        <div
          key={reward.id}
          className="pointer-events-none fixed z-50 flex animate-float-up items-center gap-2 font-bold text-amber-400"
          style={{
            left: `${reward.position.x}px`,
            top: `${reward.position.y}px`,
          }}
        >
          <img
            src="/cash/Golden Cash 1st Outline 64px.png"
            alt="coin"
            className="h-5 w-5"
          />
          +{reward.value}
        </div>
      ))}

      <div className="relative h-screen w-full max-w-lg [perspective:1000px]">
        <div className="flex items-center justify-end gap-4 pt-8 text-lg font-semibold">
          <div className="flex items-center gap-2">
            <img
              src="/points/Premium 2nd Outline 64px.png"
              alt="points"
              className="h-8 w-8"
            />
            {userPlayStats.points}
          </div>
          <div className="flex items-center gap-2" data-cash-counter>
            <img
              src="/cash/Golden Cash 1st Outline 64px.png"
              alt="cash"
              className="h-8 w-8"
            />
            {userPlayStats.cash + cashEarned}
          </div>
        </div>
        {/* Card container */}
        <div className="flex h-full flex-1 items-center justify-center">
          <div className="relative h-[350px] w-full max-w-lg [perspective:1000px]">
            <div
              className={`relative h-full max-h-[400px] w-full transition-transform duration-500 [transform-style:preserve-3d] ${
                isFlipped ? "[transform:rotateY(180deg)]" : ""
              }`}
            >
              {/* Front of card (Question) */}
              <Card className="absolute inset-0 p-6 [backface-visibility:hidden] md:p-8">
                <div className="flex h-full flex-col">
                  <div className="relative mb-8 flex items-center justify-center">
                    <h3 className="text-xl font-semibold text-foreground">
                      Card {currentIndex + 1} of {flashcards.length}
                    </h3>
                  </div>

                  <div className="flex flex-1 items-center justify-center">
                    <p className="text-center text-lg text-foreground">
                      {flashcards[currentIndex]?.question}
                    </p>
                  </div>

                  <Button
                    className="mt-4 bg-[#6C13EA] text-white hover:bg-[#6C13EA]/90"
                    onClick={handleShowAnswer}
                  >
                    Show Answer
                  </Button>
                </div>
              </Card>

              {/* Back of card (Answer) */}
              <Card className="absolute inset-0 p-6 [backface-visibility:hidden] [transform:rotateY(180deg)] md:p-8">
                <div className="flex h-full flex-col">
                  <div className="relative mb-8 flex items-center justify-center">
                    <h3 className="text-xl font-semibold text-foreground">
                      Card {currentIndex + 1} of {flashcards.length}
                    </h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="absolute right-0 gap-2"
                        >
                          <Ellipsis className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => handleCardAction("suspend")}
                        >
                          <PauseCircle className="mr-2 h-4 w-4" />
                          Suspend Card
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            setIsViewingOriginal(!isViewingOriginal)
                          }
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          {isViewingOriginal ? "View Answer" : "View Original"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex flex-1 items-center justify-center">
                    <p className="text-center text-lg text-foreground">
                      {isViewingOriginal
                        ? flashcards[currentIndex]?.content
                        : flashcards[currentIndex]?.answer}
                    </p>
                  </div>

                  <div className="mt-4 flex justify-between gap-2">
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
                    >
                      <Check className="h-5 w-5" />
                      Correct
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
