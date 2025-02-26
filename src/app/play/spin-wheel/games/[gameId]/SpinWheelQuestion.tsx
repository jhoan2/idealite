"use client";

import { useState } from "react";
import { toast } from "sonner";
import { TriviaQuestion } from "~/server/services/trivia/generation";
import * as Sentry from "@sentry/nextjs";
import { createCardFromGame } from "~/server/actions/card";
import { Button } from "~/components/ui/button";
import { Save } from "lucide-react";
import { completeSpinWheelTurn } from "~/server/actions/gameSpinWheel";

export default function SpinWheelQuestion({
  questions,
  topic,
  gameId,
}: {
  questions: TriviaQuestion[];
  topic: string;
  gameId: string;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmittingTurn, setIsSubmittingTurn] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  const handleOptionSelect = (option: string) => {
    if (!hasSubmitted) {
      setSelectedAnswer(option);
    }
  };

  const handleSubmit = async () => {
    setHasSubmitted(true);
    setIsSubmittingTurn(true);
    try {
      const isCorrect = selectedAnswer === currentQuestion?.correctAnswer;
      const points = isCorrect ? 1 : 0;
      const result = await completeSpinWheelTurn(gameId, points);
      console.log(result);
    } catch (error) {
      Sentry.captureException(error);
      toast.error("Failed to submit your turn");
    } finally {
      setIsSubmittingTurn(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setHasSubmitted(false);
    }
  };

  const handleSaveToCards = async () => {
    setIsSaving(true);

    try {
      if (!currentQuestion) return;

      // Construct content for the card
      const contentString = `Q: ${currentQuestion.question}\nA: ${
        currentQuestion.options[
          currentQuestion.correctAnswer as keyof typeof currentQuestion.options
        ]
      }`;

      // Get the topic ID from the current question
      const tagId = currentQuestion.topicId;
      // Create the card using the action
      const newCard = await createCardFromGame(contentString, tagId);

      if (!newCard) {
        throw new Error("Failed to create new card");
      }

      // Show success toast
      toast("Added to cards (+1 cash)", {
        style: {
          backgroundColor: "#4CAF50",
          color: "#fff",
          borderRadius: "8px",
          padding: "12px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          fontSize: "16px",
        },
        position: "top-right",
        icon: (
          <img
            src="/cash/Blue Cash 1st Outline 64px.png"
            alt="cash"
            width={24}
            height={24}
            style={{ marginRight: "8px" }}
          />
        ),
      });
      setIsSaved(true);
    } catch (error) {
      Sentry.captureException(error);
      toast.error("Failed to save card");
    } finally {
      setIsSaving(false);
    }
  };

  const isCorrect = selectedAnswer === currentQuestion?.correctAnswer;

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center p-6">
      <h2 className="mb-2 text-xl font-semibold text-foreground">
        Question {currentQuestionIndex + 1} of {questions.length}
      </h2>

      <div className="mb-6 w-full rounded-lg bg-card p-6 shadow-md">
        <h3 className="mb-6 text-2xl font-bold text-card-foreground">
          {currentQuestion?.question}
        </h3>

        <div className="space-y-3">
          {Object.entries(currentQuestion?.options || {}).map(
            ([key, value]) => (
              <button
                key={key}
                onClick={() => handleOptionSelect(key)}
                className={`w-full rounded-md p-4 text-left transition-colors ${
                  selectedAnswer === key
                    ? hasSubmitted
                      ? isCorrect
                        ? "border-2 border-primary bg-primary/10"
                        : key === currentQuestion?.correctAnswer
                          ? "border-2 border-primary bg-primary/10"
                          : "border-2 border-destructive bg-destructive/10"
                      : "border-2 border-primary bg-primary/10"
                    : hasSubmitted && key === currentQuestion?.correctAnswer
                      ? "border-2 border-primary bg-primary/10"
                      : "border-2 border-border hover:bg-accent"
                }`}
                disabled={hasSubmitted}
              >
                <span className="mr-2 font-bold">{key}:</span> {value}
              </button>
            ),
          )}
        </div>
      </div>

      {!hasSubmitted ? (
        <button
          onClick={handleSubmit}
          disabled={!selectedAnswer || isSubmittingTurn}
          className={`rounded-md px-6 py-3 font-bold ${
            selectedAnswer && !isSubmittingTurn
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "cursor-not-allowed bg-muted text-muted-foreground"
          }`}
        >
          {isSubmittingTurn ? "Submitting..." : "Submit Answer"}
        </button>
      ) : (
        <div className="flex flex-col items-center space-y-4">
          <div
            className={`text-xl font-bold ${isCorrect ? "text-primary" : "text-destructive"}`}
          >
            {isCorrect ? "Correct!" : "Incorrect!"}
          </div>

          {currentQuestionIndex < questions.length - 1 && (
            <button
              onClick={handleNextQuestion}
              className="rounded-md bg-primary px-6 py-3 font-bold text-primary-foreground hover:bg-primary/90"
            >
              Next Question
            </button>
          )}
        </div>
      )}

      {hasSubmitted && (
        <div className="mt-6 flex w-full items-center justify-between rounded-md bg-accent p-4">
          <div>
            <p className="font-semibold text-accent-foreground">
              Correct Answer: {currentQuestion?.correctAnswer} -{" "}
              {
                currentQuestion?.options[
                  currentQuestion?.correctAnswer as keyof typeof currentQuestion.options
                ]
              }
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Difficulty: {currentQuestion?.metadata.difficulty} | Category:{" "}
              {currentQuestion?.metadata.category}
            </p>
          </div>

          <Button
            onClick={handleSaveToCards}
            disabled={isSaving || isSaved}
            className={isSaved ? "cursor-not-allowed opacity-50" : ""}
          >
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isSaved ? "Saved" : "Save"}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
