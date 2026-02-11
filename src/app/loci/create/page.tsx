"use client";

import { useMemo, useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import type { StickerAssociation } from "~/lib/ai/types";

import { FlashcardReviewDeck } from "./_components/flashcard-review-deck";
import {
  StickerChoiceDeck,
  type StickerChoiceGroup,
} from "./_components/sticker-choice-deck";

type CreateMode = "notes" | "languages";
type NotesStep = 1 | 2 | 3 | 4;
type ReviewStatus = "unanswered" | "correct" | "wrong";

interface FlashcardReviewItem {
  id: number;
  question: string;
  answer: string;
  why_testable: string;
  confidence: number;
  reviewStatus: ReviewStatus;
}

interface ExtractedAssociation {
  id: number;
  question: string;
  answer: string;
  question_key: string;
  answer_key: string;
}

interface GenerateTwoWordChoicesApiResponse {
  success: boolean;
  data?: { choices: StickerAssociation[] };
  error?: string;
}

interface GenerateStickerMappedImageProofApiResponse {
  success: boolean;
  data?: {
    pair_id: number;
    fusion_prompt: string;
    fusion_url: string;
    fusion_model?: string;
  };
  error?: string;
}

interface GenerateFlashcardsFromNotesApiResponse {
  success: boolean;
  data?: {
    flashcards: Array<{
      id: number;
      question: string;
      answer: string;
      why_testable: string;
      confidence: number;
    }>;
  };
  error?: string;
}

interface ExtractAssociationsFromFlashcardsApiResponse {
  success: boolean;
  data?: {
    associations: Array<{
      id: number;
      question: string;
      answer: string;
      question_key: string;
      answer_key: string;
      link_verb: string;
      confidence: number;
    }>;
  };
  error?: string;
}

interface GenerateStickersApiResponse {
  success: boolean;
  data?: {
    stickers: StickerAssociation[];
    prompt_version?: string;
  };
  error?: string;
}

interface GenerateStickerImageProofApiResponse {
  success: boolean;
  data?: {
    pair_id: number;
    fusion_prompt: string;
    fusion_url: string;
    fusion_model?: string;
  };
  error?: string;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const contentType = response.headers.get("content-type") ?? "";

  if (!text) throw new Error(`Empty response body (status ${response.status})`);
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error(`Expected JSON but got ${contentType || "unknown"}`);
  }

  return JSON.parse(text) as T;
}

export default function LociCreatePage() {
  const [mode, setMode] = useState<CreateMode>("languages");

  // Notes branch
  const [notesStep, setNotesStep] = useState<NotesStep>(1);
  const [notesDraft, setNotesDraft] = useState("");
  const [notesError, setNotesError] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardReviewItem[]>([]);
  const [stickerChoiceGroups, setStickerChoiceGroups] = useState<
    StickerChoiceGroup[]
  >([]);
  const [currentStickerChoiceIndex, setCurrentStickerChoiceIndex] = useState(0);
  const [notesImage, setNotesImage] = useState<
    GenerateStickerImageProofApiResponse["data"] | null
  >(null);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [isPreparingStickers, setIsPreparingStickers] = useState(false);
  const [isGeneratingNotesImage, setIsGeneratingNotesImage] = useState(false);

  // Languages branch
  const [wordA, setWordA] = useState("");
  const [wordB, setWordB] = useState("");
  const [choices, setChoices] = useState<StickerAssociation[]>([]);
  const [selectedPairId, setSelectedPairId] = useState<number | null>(null);
  const [mappedResult, setMappedResult] = useState<
    GenerateStickerMappedImageProofApiResponse["data"] | null
  >(null);
  const [isGeneratingChoices, setIsGeneratingChoices] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [languagesError, setLanguagesError] = useState<string | null>(null);

  const selectedChoice = useMemo(
    () => choices.find((choice) => choice.pair_id === selectedPairId) ?? null,
    [choices, selectedPairId],
  );
  const isNotesBusy =
    isGeneratingFlashcards || isPreparingStickers || isGeneratingNotesImage;
  const isLanguagesBusy = isGeneratingChoices || isGeneratingImage;
  const maxUnlockedNotesStep: NotesStep = notesImage
    ? 4
    : stickerChoiceGroups.length > 0
      ? 3
      : flashcards.length > 0
        ? 2
        : 1;

  const prepareStickersFromWrongCards = async (
    reviewedCards: FlashcardReviewItem[],
  ) => {
    const wrongCards = reviewedCards.filter((card) => card.reviewStatus === "wrong");
    if (!wrongCards.length) return;

    setIsPreparingStickers(true);
    setNotesError(null);
    setStickerChoiceGroups([]);
    setCurrentStickerChoiceIndex(0);
    setNotesImage(null);
    try {
      const extractResponse = await fetch("/api/ai/extract-associations-from-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flashcards: wrongCards.map((card) => ({ id: card.id, question: card.question, answer: card.answer })),
        }),
      });
      const extractResult = await parseJsonResponse<ExtractAssociationsFromFlashcardsApiResponse>(extractResponse);
      if (!extractResponse.ok) throw new Error(extractResult.error ?? "Failed to extract associations");
      if (!extractResult.data?.associations?.length) throw new Error("No associations returned");

      const rows: ExtractedAssociation[] = extractResult.data.associations.map((row) => ({ ...row }));
      const rowById = new Map(rows.map((row) => [row.id, row] as const));
      const orderedRows = wrongCards
        .map((card) => rowById.get(card.id) ?? null)
        .filter((row): row is ExtractedAssociation => row !== null);
      if (!orderedRows.length) {
        throw new Error("No valid associations for wrong cards");
      }

      const groups = await Promise.all(
        orderedRows.map(async (row) => {
          const componentA = row.question_key.trim();
          const componentB = row.answer_key.trim();
          if (!componentA || !componentB) {
            throw new Error(`Missing association keys for card ${row.id}`);
          }

          const choicesResponse = await fetch("/api/ai/generate-stickers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pairs: [
                {
                  pair_id: row.id,
                  fact: `Q: ${row.question.trim()} A: ${row.answer.trim()}`,
                  component_a: componentA,
                  component_b: componentB,
                },
              ],
              countPerPair: 4,
            }),
          });
          const choicesResult =
            await parseJsonResponse<GenerateStickersApiResponse>(
              choicesResponse,
            );
          if (!choicesResponse.ok) {
            throw new Error(choicesResult.error ?? "Failed to generate choices");
          }
          const generatedChoices = (choicesResult.data?.stickers ?? []).filter(
            (choice) => choice.pair_id === row.id,
          );
          if (generatedChoices.length < 4) {
            throw new Error(
              `Expected 4 choices for card ${row.id}, got ${generatedChoices.length}`,
            );
          }

          return {
            cardId: row.id,
            question: row.question,
            answer: row.answer,
            choices: generatedChoices.slice(0, 4).map((choice, index) => ({
              ...choice,
              pair_id: row.id * 10 + index + 1,
            })),
          } satisfies StickerChoiceGroup;
        }),
      );

      setStickerChoiceGroups(groups);
      setCurrentStickerChoiceIndex(0);
      setNotesStep(3);
    } catch (err) {
      setNotesError(err instanceof Error ? err.message : "Failed to prepare stickers");
    } finally {
      setIsPreparingStickers(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-6 px-4 pt-8 pb-24 md:pb-8">
      <div>
        <h1 className="text-3xl font-bold">Loci Create</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Notes has a horizontal wizard. Languages keeps the existing vertical flow.
        </p>
      </div>

      <Tabs
        value={mode}
        onValueChange={(value) => setMode(value as CreateMode)}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="languages">Languages</TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notes Wizard</CardTitle>
              <CardDescription>
                Input to Flashcards to Stickers to Image
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {["Input", "Flashcards", "Stickers", "Image"].map((label, index) => {
                  const step = (index + 1) as NotesStep;
                  const locked = step > maxUnlockedNotesStep;
                  return (
                    <button
                      key={label}
                      type="button"
                      disabled={locked}
                      onClick={() => setNotesStep(step)}
                      className={`rounded-md border px-3 py-2 text-sm ${
                        notesStep === step ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"
                      } ${locked ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                      {step}. {label}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {notesError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {notesError}
            </div>
          )}

          {notesStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>1) Input Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  className="min-h-[240px] resize-y"
                  placeholder="Paste notes..."
                  disabled={isNotesBusy}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {notesDraft.length.toLocaleString()} / 6,000
                  </p>
                  <Button
                    disabled={!notesDraft.trim() || isNotesBusy}
                    onClick={async () => {
                      setIsGeneratingFlashcards(true);
                      setNotesError(null);
                      setFlashcards([]);
                      setStickerChoiceGroups([]);
                      setCurrentStickerChoiceIndex(0);
                      setNotesImage(null);
                      try {
                        const response = await fetch("/api/ai/generate-flashcards-from-notes", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ notes: notesDraft.trim(), count: 8 }),
                        });
                        const result = await parseJsonResponse<GenerateFlashcardsFromNotesApiResponse>(response);
                        if (!response.ok) throw new Error(result.error ?? "Failed to generate flashcards");
                        if (!result.data?.flashcards?.length) throw new Error("No flashcards returned");
                        setFlashcards(result.data.flashcards.map((card) => ({ ...card, reviewStatus: "unanswered" })));
                        setNotesStep(2);
                      } catch (err) {
                        setNotesError(err instanceof Error ? err.message : "Failed to generate flashcards");
                      } finally {
                        setIsGeneratingFlashcards(false);
                      }
                    }}
                  >
                    {isGeneratingFlashcards ? "Generating Flashcards..." : "Generate Flashcards"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {notesStep === 2 && (
            <FlashcardReviewDeck
              flashcards={flashcards}
              isBusy={isNotesBusy}
              onBack={() => setNotesStep(1)}
              onFlashcardsChange={setFlashcards}
              onDeckComplete={prepareStickersFromWrongCards}
            />
          )}

          {notesStep === 3 && (
            <StickerChoiceDeck
              groups={stickerChoiceGroups}
              currentIndex={currentStickerChoiceIndex}
              isBusy={isNotesBusy}
              onBack={() => setNotesStep(2)}
              onIndexChange={setCurrentStickerChoiceIndex}
              onSelectChoice={async (choice) => {
                setIsGeneratingNotesImage(true);
                setNotesError(null);
                setNotesImage(null);
                try {
                  const response = await fetch("/api/ai/generate-sticker-image-grok-test", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ sticker: choice }),
                  });
                  const result =
                    await parseJsonResponse<GenerateStickerImageProofApiResponse>(
                      response,
                    );
                  if (!response.ok) {
                    throw new Error(result.error ?? "Failed to generate image");
                  }
                  if (!result.data) throw new Error("No image data returned");
                  setNotesImage(result.data);
                  setNotesStep(4);
                } catch (err) {
                  setNotesError(
                    err instanceof Error ? err.message : "Failed to generate image",
                  );
                } finally {
                  setIsGeneratingNotesImage(false);
                }
              }}
            />
          )}

          {notesStep === 4 && notesImage && (
            <Card>
              <CardHeader>
                <CardTitle>4) Image Proof</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={notesImage.fusion_url} alt="Generated image proof" className="w-full rounded-md border" />
                </div>
                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={() => setNotesStep(3)}>
                    Back
                  </Button>
                  <Button disabled>Continue to Scene Create (Next)</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="languages" className="space-y-6">
          {languagesError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {languagesError}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>1) Input Two Words</CardTitle>
              <CardDescription>
                Word A gets mnemonic association. Word B stays literal object.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  value={wordA}
                  onChange={(e) => setWordA(e.target.value)}
                  placeholder="Foreign/source term (e.g., oreiller)"
                  disabled={isLanguagesBusy}
                />
                <Input
                  value={wordB}
                  onChange={(e) => setWordB(e.target.value)}
                  placeholder="Native meaning object (e.g., pillow)"
                  disabled={isLanguagesBusy}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={async () => {
                    if (!wordA.trim() || !wordB.trim()) return;
                    setIsGeneratingChoices(true);
                    setLanguagesError(null);
                    setChoices([]);
                    setSelectedPairId(null);
                    setMappedResult(null);
                    try {
                      const response = await fetch("/api/ai/generate-two-word-choices", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ wordA: wordA.trim(), wordB: wordB.trim(), count: 4 }),
                      });
                      const result = await parseJsonResponse<GenerateTwoWordChoicesApiResponse>(response);
                      if (!response.ok) throw new Error(result.error ?? "Failed to generate choices");
                      if (!result.data?.choices?.length) throw new Error("No choices generated");
                      setChoices(result.data.choices);
                      setSelectedPairId(result.data.choices[0]?.pair_id ?? null);
                    } catch (err) {
                      setLanguagesError(err instanceof Error ? err.message : "Failed to generate choices");
                    } finally {
                      setIsGeneratingChoices(false);
                    }
                  }}
                  disabled={isLanguagesBusy || !wordA.trim() || !wordB.trim()}
                >
                  {isGeneratingChoices ? "Generating Choices..." : "Generate Choices"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {choices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>2) Pick One Choice</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {choices.map((choice) => {
                  const isSelected = choice.pair_id === selectedPairId;
                  return (
                    <button
                      key={choice.pair_id}
                      type="button"
                      onClick={() => {
                        setSelectedPairId(choice.pair_id);
                        setMappedResult(null);
                      }}
                      className={`w-full rounded-md border p-3 text-left ${isSelected ? "border-primary bg-primary/5" : "hover:border-muted-foreground/40"}`}
                    >
                      <p className="text-sm">{choice.component_a.label} {"->"} {choice.component_a.symbol}</p>
                      <p className="text-sm">{choice.component_b.label} {"->"} {choice.component_b.symbol}</p>
                      <p className="text-sm text-muted-foreground">{choice.interaction}</p>
                    </button>
                  );
                })}

                <div className="flex justify-end">
                  <Button
                    disabled={isLanguagesBusy || !selectedChoice}
                    onClick={async () => {
                      if (!selectedChoice) return;
                      setIsGeneratingImage(true);
                      setLanguagesError(null);
                      setMappedResult(null);
                      try {
                        const response = await fetch("/api/ai/generate-sticker-image-grok-test", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ sticker: selectedChoice }),
                        });
                        const result = await parseJsonResponse<GenerateStickerMappedImageProofApiResponse>(response);
                        if (!response.ok) throw new Error(result.error ?? "Failed to generate image");
                        if (!result.data) throw new Error("No image data returned");
                        setMappedResult(result.data);
                      } catch (err) {
                        setLanguagesError(err instanceof Error ? err.message : "Failed to generate image");
                      } finally {
                        setIsGeneratingImage(false);
                      }
                    }}
                  >
                    {isGeneratingImage ? "Generating Image..." : "Generate Image"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {mappedResult && (
            <Card>
              <CardHeader>
                <CardTitle>3) Generated Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mappedResult.fusion_url} alt="Generated image" className="w-full rounded-md border" />
                </div>
                <div className="flex justify-end">
                  <Button disabled>Continue to Scene Create (Next)</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
