"use client";

import { GameSessionWithMoves } from "~/server/queries/gameSession";
import NotYourTurn from "./NotYourTurn";
import SpinGameRound from "./SpinGameRound";

interface SpinWheelInProgressProps {
  gameSession: GameSessionWithMoves;
  currentUsername: string;
}

export default function SpinWheelInProgress({
  gameSession,
  currentUsername,
}: SpinWheelInProgressProps) {
  const currentTurnIndex = gameSession.current_turn_player_index;
  const players = gameSession.players;
  const round = Math.floor(gameSession.moves.length / players.length);

  const isUserTurn = players[currentTurnIndex] === currentUsername;

  if (!isUserTurn) {
    return (
      <NotYourTurn
        gameSession={gameSession}
        currentUsername={currentUsername}
      />
    );
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
