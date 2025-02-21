"use client";

import { GameSessionWithMoves } from "~/server/queries/gameSession";
import NotYourTurn from "./NotYourTurn";
import SelectTopic from "./SelectTopic";
import ClashGameRound from "./ClashGameRound";

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
  const topics = gameSession.topics || [];
  const round = Math.floor(gameSession.moves.length / players.length);

  const isUserTurn = players[currentTurnIndex] === currentUsername;
  if (!isUserTurn) {
    return <NotYourTurn />;
  }

  const needsTopicSelection = topics.length !== players.length;
  const currentTopic = topics[round] || "";
  return (
    <div>
      {needsTopicSelection ? (
        <SelectTopic
          gameSession={gameSession}
          currentUsername={currentUsername}
        />
      ) : (
        <ClashGameRound
          gameSession={gameSession}
          currentUsername={currentUsername}
          currentTopic={currentTopic}
          round={round}
        />
      )}
    </div>
  );
}
