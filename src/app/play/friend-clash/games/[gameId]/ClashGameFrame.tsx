"use client";

import { useState, useEffect } from "react";
import { sdk } from "@farcaster/frame-sdk";
import Lobby from "./Lobby";
import ClashInProgress from "./ClashInProgress";
import { GameSessionWithMoves } from "~/server/queries/gameSession";
import ClashCompleted from "./ClashCompleted";

interface ClashGameFrameProps {
  gameSession: GameSessionWithMoves;
  currentUsername: string;
}

export default function ClashGameFrame({
  gameSession,
  currentUsername,
}: ClashGameFrameProps) {
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
      <ClashInProgress
        gameSession={gameSession}
        currentUsername={currentUsername}
      />
    );
  }

  if (gameSession.status === "completed") {
    return <ClashCompleted gameSession={gameSession} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <h1 className="text-4xl font-bold">Game has ended</h1>
    </div>
  );
}
