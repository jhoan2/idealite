import { GameSessionWithMoves } from "~/server/queries/gameSession";
import { useState } from "react";
import SpinWheelQuestion from "./SpinWheelQuestion";
import TopicWheel from "./TopicWheel";
import { TriviaQuestion } from "~/server/services/trivia/generation";

interface SpinGameRoundProps {
  gameSession: GameSessionWithMoves;
  currentUsername: string;
  round: number;
}

export default function SpinGameRound({
  gameSession,
  currentUsername,
  round,
}: SpinGameRoundProps) {
  const [gameQuestions, setGameQuestions] = useState<TriviaQuestion[]>([]);
  const [currentTopic, setCurrentTopic] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  const handleQuestionsLoaded = (questions: any, topic: any) => {
    setGameQuestions(questions);
    setCurrentTopic(topic);
    setGameStarted(true);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold">Round {round + 1} of 3</h2>
        <div className="mt-2 flex justify-center space-x-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                i === round
                  ? "border-primary bg-primary text-white"
                  : i < round
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-gray-300 bg-gray-100 text-gray-400"
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
        <p className="mt-2 text-muted-foreground">{currentUsername}'s turn</p>
      </div>
      {!gameStarted ? (
        <TopicWheel
          onQuestionsLoaded={handleQuestionsLoaded}
          topics={gameSession.topics || []}
        />
      ) : (
        <SpinWheelQuestion
          questions={gameQuestions}
          topic={currentTopic || ""}
          gameId={gameSession.id}
        />
      )}
    </div>
  );
}
