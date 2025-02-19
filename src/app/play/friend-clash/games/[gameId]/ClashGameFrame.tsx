"use client";

import { useState, useEffect } from "react";
import { sdk } from "@farcaster/frame-sdk";
import Lobby from "./Lobby";
import ClashInProgress from "./ClashInProgress";
import { GameSession } from "~/server/db/schema";

interface ClashGameFrameProps {
  gameSession: GameSession;
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

  // Handle other states (completed, abandoned)
  return <div>Game has ended</div>;
}
