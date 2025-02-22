import { GameSessionWithMoves } from "~/server/queries/gameSession";
import { PlayerScoresChart } from "./PlayerScoresChart";

export default function ClashIntro({
  gameSession,
  currentUsername,
  currentTopic,
  round,
}: {
  gameSession: GameSessionWithMoves;
  currentUsername: string;
  currentTopic: string;
  round: number;
}) {
  const nextTopic = gameSession.topics?.[round];
  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-6">
      <h1 className="mb-4 text-2xl font-bold md:mb-8 md:text-3xl">
        Round {round + 1}
      </h1>
      {nextTopic && (
        <h2 className="mb-4 text-lg md:mb-6 md:text-xl">
          Next Topic: {nextTopic}
        </h2>
      )}
      <div className="w-full max-w-4xl">
        <PlayerScoresChart gameSession={gameSession} />
      </div>
    </div>
  );
}
