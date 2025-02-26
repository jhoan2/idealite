"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import { SpinWheelScores } from "./SpinWheelScores";
import { GameSessionWithMoves } from "~/server/queries/gameSession";
import { usePostHog } from "posthog-js/react";

export default function NotYourTurn({
  gameSession,
  currentUsername,
}: {
  gameSession: GameSessionWithMoves;
  currentUsername: string;
}) {
  const [showScores, setShowScores] = useState(false);
  const posthog = usePostHog();

  useEffect(() => {
    const currentPlayerInfo = gameSession.player_info.find(
      (player) => player.username === currentUsername,
    );
    posthog.capture("viewed_not_your_turn", {
      gameId: gameSession.id,
      gameType: "spin-wheel",
      username: currentPlayerInfo?.username,
      displayName: currentPlayerInfo?.display_name,
      pfp_url: currentPlayerInfo?.pfp_url,
      fid: currentPlayerInfo?.fid,
    });
  }, [posthog, gameSession.id, currentUsername]);

  return (
    <div className="h-[100dvh] w-full bg-[#33A33C]">
      <div className="flex h-full w-full flex-col items-center justify-center">
        {showScores && gameSession ? (
          <div className="flex w-full max-w-3xl flex-col items-center justify-center gap-6 rounded-lg bg-white p-8">
            <h2 className="text-xl font-bold">Current Scores</h2>
            <SpinWheelScores gameSession={gameSession} />
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowScores(false)}
            >
              Back
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-6">
            <h1 className="text-2xl font-bold text-white">Spin the Wheel</h1>
            <h2 className="text-lg font-bold text-white">
              It's not your turn!
            </h2>
            <img
              src="/games/spin-the-wheel.png"
              alt="Spin Wheel"
              className="h-48 w-48 object-contain"
              width={192}
              height={192}
            />
            <div className="flex w-48 flex-col gap-4">
              <Button
                variant="secondary"
                className="mb-2 w-full"
                onClick={() => setShowScores(true)}
              >
                View Scores
              </Button>
              <Button variant="secondary" className="w-full">
                <Link href="/play/spin-wheel/games">Your Games</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
