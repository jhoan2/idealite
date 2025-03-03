"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";

interface GeneratedImageResult {
  image: string;
  description?: string;
}

export function GenerateImage() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GeneratedImageResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateImage = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/memory-palace/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image");
      }

      setResult(data.data);
    } catch (err) {
      console.error("Error generating image:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-md mb-4 font-medium">Generate Image</h3>
      <textarea
        className="mb-2 w-full rounded-md border p-2"
        rows={5}
        placeholder="Describe the image you want to generate..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <Button
        className="mb-4 w-full"
        onClick={handleGenerateImage}
        disabled={isLoading || !prompt.trim()}
      >
        {isLoading ? "Generating..." : "Generate Image"}
      </Button>

      {error && (
        <div className="mt-2 rounded-md bg-red-100 p-2 text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4">
          <h4 className="mb-2 text-sm font-medium">
            Generated Image Description:
          </h4>
          {result.image && (
            <div className="mt-2">
              <img
                src={result.image}
                alt={result.description || "Generated image"}
                className="h-auto max-w-full rounded-md"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
