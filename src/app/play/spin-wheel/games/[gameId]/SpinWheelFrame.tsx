"use client";

import { useState, useEffect } from "react";
import { sdk } from "@farcaster/frame-sdk";
import { GameSessionWithMoves } from "~/server/queries/gameSession";
import Lobby from "./Lobby";
import SpinWheelInProgress from "./SpinWheelInProgress";

interface SpinWheelGameFrameProps {
  gameSession: GameSessionWithMoves;
  currentUsername: string;
}

export default function ClashGameFrame({
  gameSession,
  currentUsername,
}: SpinWheelGameFrameProps) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const isHost = gameSession.players[0] === currentUsername;

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

  if (gameSession.status === "created") {
    return (
      <Lobby
        gameSession={gameSession}
        isHost={isHost}
        currentUsername={currentUsername}
      />
    );
  }

  if (gameSession.status === "in_progress") {
    return (
      <SpinWheelInProgress
        gameSession={gameSession}
        currentUsername={currentUsername}
      />
    );
  }

  if (gameSession.status === "completed") {
    return <div>completed</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <h1 className="text-4xl font-bold">Game has ended</h1>
    </div>
  );
}
