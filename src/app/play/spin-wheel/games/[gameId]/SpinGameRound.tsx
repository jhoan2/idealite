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
      {!gameStarted ? (
        <TopicWheel
          onQuestionsLoaded={handleQuestionsLoaded}
          topics={gameSession.topics || []}
        />
      ) : (
        // <SpinWheelQuestion questions={gameQuestions} topic={currentTopic} />
        <SpinWheelQuestion
          questions={gameQuestions}
          topic={currentTopic || ""}
        />
      )}
    </div>
  );
}
