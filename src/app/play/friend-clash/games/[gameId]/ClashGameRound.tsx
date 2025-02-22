"use client";

import { useState, useEffect, useRef } from "react";
import { GameSessionWithMoves } from "~/server/queries/gameSession";
import ClashIntro from "./ClashIntro";
import { type TriviaQuestion } from "~/server/services/trivia/generation";
import { DigitalCountdown } from "./DigitalCountdown";
import { Button } from "~/components/ui/button";
import { createGameMove } from "~/server/actions/gameMove";
import * as Sentry from "@sentry/nextjs";
interface AnsweredQuestion {
  question: TriviaQuestion;
  userAnswer: string;
  correct: boolean;
}
interface ClashGameRoundProps {
  gameSession: GameSessionWithMoves;
  currentUsername: string;
  currentTopic: string;
  round: number;
}

export default function ClashGameRound({
  gameSession,
  currentUsername,
  currentTopic,
  round,
}: ClashGameRoundProps) {
  const [loading, setLoading] = useState(true);
  const [showingIntro, setShowingIntro] = useState(true);
  const [gameState, setGameState] = useState<
    "countdown" | "playing" | "finished"
  >("playing");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<
    AnsweredQuestion[]
  >([]);
  const [questions, setQuestions] = useState<TriviaQuestion[] | null>(null);
  const moveSubmittingRef = useRef(false);

  // Handle data fetching
  useEffect(() => {
    async function fetchCards() {
      try {
        const res = await fetch(`/api/trivia?topic=${currentTopic}`);
        if (!res.ok) {
          throw new Error("Failed to generate cards");
        }
        const data = await res.json();
        setQuestions(data.data);
      } catch (error) {
        console.error("Error fetching cards:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCards();
  }, [currentTopic]);

  const submitGameMove = async () => {
    if (moveSubmittingRef.current) return;
    moveSubmittingRef.current = true;

    try {
      const result = await createGameMove({
        sessionId: gameSession.id,
        points: score,
      });

      if (!result.success) {
        console.error("Failed to submit game move:", result.error);
        Sentry.captureException(result.error, {
          extra: { info: "Failed to submit Friend Clash move" },
        });
      }
    } catch (error) {
      console.error("Error submitting game move:", error);
      Sentry.captureException(error);
    }
  };

  // Start game after countdown
  const startGame = () => {
    setGameState("playing");
  };

  // Handle answer selection
  const handleAnswer = (selectedAnswer: string) => {
    if (!questions) return;
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;
    const correct = selectedAnswer === currentQuestion.correctAnswer;

    // Track answer
    setAnsweredQuestions((prev) => [
      ...prev,
      {
        question: currentQuestion,
        userAnswer: selectedAnswer,
        correct,
      },
    ]);

    // Update score
    if (correct) {
      setScore((prev) => prev + 1);
    }

    if (currentQuestionIndex === questions.length - 1) {
      setGameState("finished");
      if (!moveSubmittingRef.current) {
        setGameState("finished");
        submitGameMove();
      }
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  // Handle game end
  const onTimeUp = () => {
    if (!moveSubmittingRef.current) {
      setGameState("finished");
      submitGameMove();
    }
  };

  if (showingIntro || loading) {
    return (
      <div>
        <ClashIntro
          gameSession={gameSession}
          currentUsername={currentUsername}
          currentTopic={currentTopic}
          round={round}
        />
        <div className="flex justify-center pt-10">
          <Button onClick={() => setShowingIntro(false)}>Start Game</Button>
        </div>
      </div>
    );
  }

  // Render based on game state
  if (gameState === "countdown") {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <DigitalCountdown duration={5} onTimeUp={startGame} />
        <h2 className="mt-4 text-2xl">Get Ready!</h2>
      </div>
    );
  }

  if (gameState === "playing") {
    if (!questions) return;

    const currentQuestion = questions[currentQuestionIndex];

    return (
      <div className="flex flex-col p-6">
        <div className="mb-4 flex flex-col">
          <span className="text-xl font-bold">Score: {score}</span>
          <div className="flex justify-center">
            <DigitalCountdown duration={30} onTimeUp={onTimeUp} />
          </div>
        </div>

        <div className="mb-6 flex justify-center">
          {currentQuestion && (
            <div className="">
              <h2 className="mb-4 text-xl">{currentQuestion.question}</h2>
              <div className="flex flex-col gap-2">
                {Object.entries(currentQuestion.options).map(([key, value]) => (
                  <Button
                    key={key}
                    onClick={() => handleAnswer(key)}
                    className="p-4 text-left"
                  >
                    {key}: {value}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Review screen
  return (
    <div className="p-6">
      <h2 className="mb-4 text-2xl font-bold">Game Over!</h2>
      <p className="mb-6 text-xl">Final Score: {score}</p>

      <div className="space-y-4">
        <h3 className="text-xl font-bold">Review</h3>
        {answeredQuestions.map((card, index) => (
          <div
            key={index}
            className={`rounded-lg p-4 ${card.correct ? "bg-green-100" : "bg-red-100"} text-black`}
          >
            <p className="font-bold">{card.question.question}</p>
            <p>
              Your answer: {card.userAnswer} -{" "}
              {
                card.question.options[
                  card.userAnswer as keyof typeof card.question.options
                ]
              }
            </p>
            <p>
              Correct answer: {card.question.correctAnswer} -{" "}
              {card.question.options[card.question.correctAnswer]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
