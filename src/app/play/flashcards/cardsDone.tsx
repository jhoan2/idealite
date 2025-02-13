"use client";

import { Button } from "~/components/ui/button";
import Confetti from "./Confetti";
import Link from "next/link";
import { CardUpdate } from "./flashcards";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { incrementUserCash } from "~/server/actions/user";
import { processFlashCards } from "~/server/actions/card";

export default function CardsDone({
  cashEarned,
  pendingUpdates,
  setPendingUpdates,
  setCashEarned,
}: {
  cashEarned: number;
  pendingUpdates: CardUpdate[];
  setPendingUpdates: (updates: CardUpdate[]) => void;
  setCashEarned: (earned: number) => void;
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    const saveProgress = async () => {
      if (pendingUpdates.length === 0) return;

      setIsUpdating(true);
      setSaveError(false);

      try {
        // Process all card updates in one batch
        await processFlashCards(pendingUpdates);

        // Update user balance if cash was earned
        if (cashEarned > 0) {
          await incrementUserCash(cashEarned);
        }

        setPendingUpdates([]);
        setCashEarned(0);
      } catch (error) {
        console.error("Error processing batch updates:", error);
        toast.error("Failed to save progress. You can try again later.");
        setSaveError(true);
      } finally {
        setIsUpdating(false);
      }
    };

    void saveProgress();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Confetti />
      <div className="space-y-8 text-center duration-500 animate-in fade-in zoom-in">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white delay-200 duration-700 animate-in fade-in slide-in-from-bottom-4">
            Cards Done!
          </h1>
          <div className="space-y-2 delay-300 duration-700 animate-in fade-in slide-in-from-bottom-4">
            <p className="text-slate-400">
              Great job completing your daily practice!
            </p>
            <p className="text-slate-400">
              {`You completed ${pendingUpdates.length} cards`}
            </p>
            {cashEarned > 0 && (
              <p className="text-emerald-400">
                {`Earned ${cashEarned} coins!`}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3 delay-500 duration-700 animate-in fade-in slide-in-from-bottom-4">
          {isUpdating ? (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p className="text-slate-400">Saving progress...</p>
            </div>
          ) : saveError ? (
            <p className="text-red-400">
              Failed to save progress. Don't worry - you can try again later!
            </p>
          ) : (
            <Link href="/play">
              <Button
                variant="secondary"
                size="lg"
                className="h-12 w-full min-w-[200px] text-lg transition-all hover:scale-105"
              >
                Back to Play
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
