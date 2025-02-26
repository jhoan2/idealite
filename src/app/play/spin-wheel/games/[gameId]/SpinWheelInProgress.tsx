"use client";

import { GameSessionWithMoves } from "~/server/queries/gameSession";
import NotYourTurn from "./NotYourTurn";
import SpinGameRound from "./SpinGameRound";

interface ClashInProgressProps {
  gameSession: GameSessionWithMoves;
  currentUsername: string;
}

export default function ClashInProgress({
  gameSession,
  currentUsername,
}: ClashInProgressProps) {
  const currentTurnIndex = gameSession.current_turn_player_index;
  const players = gameSession.players;
  const round = Math.floor(gameSession.moves.length / players.length);

  const isUserTurn = players[currentTurnIndex] === currentUsername;
  if (!isUserTurn) {
    return <NotYourTurn />;
  }

  return (
    <div>
      <SpinGameRound
        gameSession={gameSession}
        currentUsername={currentUsername}
        round={round}
      />
    </div>
  );
}
