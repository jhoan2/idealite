"use client";

import { useState } from "react";
import Wheel from "./Wheel";
import { TriviaQuestion } from "~/server/services/trivia/generation";

export default function TopicWheel({
  onQuestionsLoaded,
  topics,
}: {
  onQuestionsLoaded: (questions: TriviaQuestion[], topic: string) => void;
  topics: string[];
}) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Colors for wheel segments - match with number of topics
  const segColors = [
    "#FF6384",
    "#36A2EB",
    "#FFCE56",
    "#4BC0C0",
    "#9966FF",
    "#FF9F40",
    "#C9CBCF",
    "#7AC142",
    "#E67E22",
    "#8E44AD",
  ];

  // Handle when wheel stops spinning
  const handleWheelFinished = async (topic: string) => {
    setSelectedTopic(topic);
    setIsLoading(true);
    setError(null);
    try {
      // Call the trivia API with the selected topic
      const response = await fetch(
        `/api/trivia?topic=${topic.toLowerCase()}&count=1`,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch questions: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setQuestions(data.data);
      } else {
        throw new Error(data.error || "Failed to load questions");
      }
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching questions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="mb-4 text-2xl font-bold">
        Spin the Wheel to Select a Topic
      </h2>

      {/* Display wheel when no topic selected */}
      {!selectedTopic && (
        <div className="my-6">
          <Wheel
            segments={topics}
            segColors={segColors}
            onFinished={handleWheelFinished}
            primaryColor="#333"
            primaryColorAround="#46237A"
            contrastColor="#ffffff"
            buttonText="SPIN"
            size={290}
          />
        </div>
      )}

      {/* Show loading or selected topic */}
      {selectedTopic && (
        <div className="my-6 text-center">
          <div className="text-xl">
            Selected Topic: <span className="font-bold">{selectedTopic}</span>
          </div>

          {isLoading && (
            <div className="my-4">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-purple-500"></div>
              <p className="mt-2">Loading questions...</p>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-md bg-red-100 p-3 text-red-800">
              {error}
            </div>
          )}

          {!isLoading && !error && questions.length > 0 && (
            <>
              <div className="mt-4 text-green-700">
                ✅ Loaded {questions.length} questions!
              </div>
              <button
                onClick={() => onQuestionsLoaded(questions, selectedTopic)}
                className="mt-4 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
              >
                Continue with Question
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
