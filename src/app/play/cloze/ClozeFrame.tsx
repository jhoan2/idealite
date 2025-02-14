"use client";

import { sdk } from "@farcaster/frame-sdk";
import { useEffect, useState } from "react";
import FlashCards from "../flashcards/flashcards";
import { CardSchema } from "~/app/api/flashcards/route";
import NoCardsDue from "../flashcards/NoCardsDue";

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

export default function ClozeFrame({
  flashcards,
  userPlayStats,
}: {
  flashcards: FlashCard[];
  userPlayStats: { points: number; cash: number };
}) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      sdk.actions.ready();
    };

    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  if (flashcards.length === 0) {
    return <NoCardsDue />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <FlashCards flashcards={flashcards} userPlayStats={userPlayStats} />
    </div>
  );
}
