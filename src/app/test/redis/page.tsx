"use client";

import { useState } from "react";
import { Redis } from "@upstash/redis";

export default function TestRedisPage() {
  const [topicName, setTopicName] = useState("");
  const [topicId, setTopicId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingTrivia, setIsDeletingTrivia] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const generateTrivia = async () => {
    if (!topicName || !topicId) {
      setResult("Please enter both topic name and ID");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/trivia/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topicName: topicName.toLowerCase(), topicId }),
      });

      const data = await response.json();
      setResult(
        data.success
          ? `✅ Successfully generated questions for ${topicName}`
          : `❌ Failed to generate questions: ${JSON.stringify(data)}`,
      );
    } catch (error) {
      setResult(
        `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAllTriviaKeys = async () => {
    if (!confirm("Are you sure you want to delete all trivia-related keys?")) {
      return;
    }

    setIsDeletingTrivia(true);
    setResult(null);

    try {
      const response = await fetch("/api/redis/delete-trivia-keys", {
        method: "POST",
      });

      const data = await response.json();
      setResult(
        data.success
          ? `✅ Successfully deleted ${data.deletedCount} trivia keys`
          : `❌ Failed to delete trivia keys: ${data.error}`,
      );
    } catch (error) {
      setResult(
        `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsDeletingTrivia(false);
    }
  };

  return (
    <div className="mx-auto max-w-md p-8">
      <h1 className="mb-6 text-2xl font-bold">Trivia Generator Test</h1>

      <div className="mb-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Topic Name</label>
          <input
            type="text"
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
            className="w-full rounded border p-2"
            placeholder="e.g., History"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Topic ID</label>
          <input
            type="text"
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className="w-full rounded border p-2"
            placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
          />
        </div>
      </div>

      <button
        onClick={generateTrivia}
        disabled={isLoading}
        className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-400"
      >
        {isLoading ? "Generating..." : "Generate Trivia Questions"}
      </button>

      <div className="mt-4">
        <button
          onClick={deleteAllTriviaKeys}
          disabled={isDeletingTrivia}
          className="w-full rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:bg-red-400"
        >
          {isDeletingTrivia ? "Deleting..." : "Delete All Trivia Keys"}
        </button>
      </div>

      {result && (
        <div
          className={`mt-4 rounded p-3 text-black ${result.startsWith("✅") ? "bg-green-100" : "bg-red-100"}`}
        >
          {result}
        </div>
      )}
    </div>
  );
}
