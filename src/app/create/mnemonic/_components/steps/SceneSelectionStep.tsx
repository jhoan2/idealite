"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { useWizard } from "../WizardContext";
import type { SceneCard, GenerateScenesResponse } from "~/lib/ai/types";

interface GenerateScenesApiResponse {
  success: boolean;
  data?: GenerateScenesResponse;
  error?: string;
}

const structureLabels: Record<string, string> = {
  sequence: "Sequence",
  panorama: "Panorama",
  snapshot: "Snapshot",
};

const techniqueBadgeColors: Record<string, string> = {
  phonetic:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  semantic:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  numeric:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  pao: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

function SceneCardDisplay({
  card,
  isSelected,
  onSelect,
}: {
  card: SceneCard;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isSelected && "ring-2 ring-primary shadow-md"
      )}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="truncate">{card.scene_title}</span>
          <span className="ml-2 shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-normal">
            {structureLabels[card.structure] ?? card.structure}
          </span>
        </CardTitle>
        <p className="text-xs text-muted-foreground">{card.setting}</p>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <ul className="space-y-2">
          {card.characters.map((char, i) => (
            <li key={i} className="text-sm">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-muted-foreground">
                  &bull;
                </span>
                <div className="min-w-0">
                  <span className="font-medium">{char.symbol}</span>
                  <span className="mx-1 text-muted-foreground">&rarr;</span>
                  <span>{char.represents}</span>
                  <span
                    className={cn(
                      "ml-1.5 inline-block rounded px-1 py-0.5 text-[10px] font-medium",
                      techniqueBadgeColors[char.technique] ??
                        "bg-gray-100 text-gray-700"
                    )}
                  >
                    {char.technique}
                  </span>
                  <p className="mt-0.5 text-xs italic text-muted-foreground">
                    {char.reasoning}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <p className="border-t pt-2 text-xs text-muted-foreground">
          {card.narrative}
        </p>

        <Button
          variant={isSelected ? "default" : "outline"}
          size="sm"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          {isSelected ? "Selected" : "Select"}
        </Button>
      </CardContent>
    </Card>
  );
}

export function SceneSelectionStep() {
  const {
    sceneCards,
    selectedCard,
    setSelectedCard,
    setSceneCards,
    inputText,
    highlights,
    prevStep,
    setIsLoading,
    setError,
  } = useWizard();

  const [regenerating, setRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setRegenerating(true);
    setIsLoading(true);
    setError(null);
    setSelectedCard(null);

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
        throw new Error(errorData.error ?? "Failed to regenerate scenes");
      }

      const result = (await response.json()) as GenerateScenesApiResponse;
      const data = result.data;

      if (!data?.scenes?.length) {
        throw new Error("No scenes returned");
      }

      setSceneCards(data.scenes);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to regenerate scenes"
      );
    } finally {
      setRegenerating(false);
      setIsLoading(false);
    }
  };

  const handleSelect = (card: SceneCard) => {
    setSelectedCard(
      selectedCard?.scene_title === card.scene_title ? null : card
    );
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Choose a Scene</h2>
        <p className="mt-1 text-muted-foreground">
          Each card is a unique mnemonic scene with different structures,
          settings, and symbolization techniques. Pick the one that resonates
          most.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sceneCards.map((card, i) => (
          <SceneCardDisplay
            key={`${card.scene_title}-${i}`}
            card={card}
            isSelected={selectedCard?.scene_title === card.scene_title}
            onSelect={() => handleSelect(card)}
          />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={prevStep} disabled={regenerating}>
          Back
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRegenerate}
            disabled={regenerating}
          >
            {regenerating ? (
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
                Regenerating...
              </>
            ) : (
              "Regenerate"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
