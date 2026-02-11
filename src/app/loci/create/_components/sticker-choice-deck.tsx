"use client";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { StickerAssociation } from "~/lib/ai/types";

export interface StickerChoiceGroup {
  cardId: number;
  question: string;
  answer: string;
  choices: StickerAssociation[];
}

interface StickerChoiceDeckProps {
  groups: StickerChoiceGroup[];
  currentIndex: number;
  isBusy: boolean;
  onBack: () => void;
  onIndexChange: (index: number) => void;
  onSelectChoice: (choice: StickerAssociation) => void;
}

export function StickerChoiceDeck({
  groups,
  currentIndex,
  isBusy,
  onBack,
  onIndexChange,
  onSelectChoice,
}: StickerChoiceDeckProps) {
  if (!groups.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>3) Sticker Candidates</CardTitle>
          <CardDescription>No sticker choices available yet.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Review flashcards first to build choices.
          </p>
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  const safeIndex = Math.min(Math.max(currentIndex, 0), groups.length - 1);
  const activeGroup = groups[safeIndex];

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-start">
          <Button variant="outline" size="sm" onClick={onBack}>
            Back
          </Button>
        </div>
        <CardTitle>3) Sticker Candidates</CardTitle>
        <CardDescription>
          Review the flashcard and choose one association to generate image proof.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant="outline">
            Card {safeIndex + 1} of {groups.length}
          </Badge>
          <Badge variant="outline">Choice Count {activeGroup.choices.length}</Badge>
        </div>

        <div className="rounded-md border p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Question
          </p>
          <p className="mt-1 text-sm font-medium">{activeGroup.question}</p>
          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Answer
          </p>
          <p className="mt-1 text-sm">{activeGroup.answer}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {activeGroup.choices.map((choice, index) => (
            <button
              key={`${activeGroup.cardId}-${index}-${choice.pair_id}`}
              type="button"
              disabled={isBusy}
              onClick={() => onSelectChoice(choice)}
              className="rounded-md border p-3 text-left transition-colors hover:border-muted-foreground/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <p className="text-sm">
                {choice.component_a.label} {"->"} {choice.component_a.symbol}
              </p>
              <p className="text-sm">
                {choice.component_b.label} {"->"} {choice.component_b.symbol}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {choice.interaction}
              </p>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            disabled={safeIndex === 0 || isBusy}
            onClick={() => onIndexChange(safeIndex - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={safeIndex === groups.length - 1 || isBusy}
            onClick={() => onIndexChange(safeIndex + 1)}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
