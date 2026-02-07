"use client";

import { useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { useWizard } from "../WizardContext";
import type { GenerateScenesResponse } from "~/lib/ai/types";

interface GenerateScenesApiResponse {
  success: boolean;
  data?: GenerateScenesResponse;
  error?: string;
}

export function InputStep() {
  const {
    inputText,
    setInputText,
    highlights,
    addHighlight,
    removeHighlight,
    setSceneCards,
    nextStep,
    setIsLoading,
    setError,
  } = useWizard();

  const [localLoading, setLocalLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleHighlightSelection = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start === end) return;

    const selectedText = inputText.slice(start, end).trim();
    if (!selectedText) return;

    if (highlights.includes(selectedText)) return;

    addHighlight(selectedText);
    textarea.setSelectionRange(end, end);
  };

  const handleGenerateScenes = async () => {
    if (!inputText.trim()) {
      setError("Please enter some study notes to analyze");
      return;
    }

    setLocalLoading(true);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-scenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: inputText,
          highlights: highlights.length > 0 ? highlights : undefined,
        }),
      });

      if (!response.ok) {
        const errorData =
          (await response.json()) as GenerateScenesApiResponse;
        throw new Error(errorData.error ?? "Failed to generate scenes");
      }

      const result = (await response.json()) as GenerateScenesApiResponse;
      const data = result.data;

      if (!data?.scenes?.length) {
        throw new Error("No scenes returned from API");
      }

      setSceneCards(data.scenes);
      nextStep();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate scenes"
      );
    } finally {
      setLocalLoading(false);
      setIsLoading(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Enter Your Study Notes</CardTitle>
        <CardDescription>
          Paste your notes below, then optionally{" "}
          <strong>select text and click &quot;Highlight&quot;</strong> to mark
          the key facts you want to memorize. If you don&apos;t highlight
          anything, the AI will pick the most important facts automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          ref={textareaRef}
          placeholder="Paste your study notes here...

Example:
- The Krebs Cycle begins with Citrate Synthase combining Acetyl-CoA with Oxaloacetate
- Aconitase converts Citrate to Isocitrate
- The standard dose is 52mg daily"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="min-h-[250px] resize-y font-mono text-sm"
          disabled={localLoading}
        />

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleHighlightSelection}
            disabled={localLoading}
          >
            Highlight Selection
          </Button>
          <span className="text-xs text-muted-foreground">
            Select text above, then click to highlight
          </span>
        </div>

        {highlights.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Highlighted passages ({highlights.length}):
            </p>
            <div className="flex flex-wrap gap-2">
              {highlights.map((h, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-md bg-yellow-100 px-2 py-1 text-xs text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
                >
                  &quot;{h.length > 60 ? h.slice(0, 60) + "..." : h}&quot;
                  <button
                    onClick={() => removeHighlight(i)}
                    className="ml-1 hover:text-red-600"
                    disabled={localLoading}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            onClick={handleGenerateScenes}
            disabled={localLoading || !inputText.trim()}
            size="lg"
          >
            {localLoading ? (
              <>
                <svg
                  className="mr-2 h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating Scenes...
              </>
            ) : (
              "Generate Scenes"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
