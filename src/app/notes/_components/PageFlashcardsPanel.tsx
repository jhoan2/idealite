"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Label } from "~/components/ui/label";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Skeleton } from "~/components/ui/skeleton";
import { Textarea } from "~/components/ui/textarea";
import { deleteCard, updateCard } from "~/server/actions/card";
import {
  buildClozePayload,
  buildImagePayload,
  buildQAPayload,
  parseCardPayload,
  resolveCardImageSrc,
} from "~/lib/flashcards/cardPayload";
import { Clock3, Ellipsis, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "~/lib/utils";

type FlashcardType = "qa" | "cloze" | "image";
type FlashcardStatus = "active" | "mastered" | "suspended";
type EditMode = "qa" | "cloze" | "image";

interface ApiFlashcard {
  id: string;
  card_type: string | null;
  card_payload: unknown;
  card_payload_version: number;
  content: string | null;
  image_cid: string | null;
  description: string | null;
  next_review: string | null;
  status: FlashcardStatus;
}

interface NoteFlashcard {
  id: string;
  type: FlashcardType;
  front: string;
  backPreview: string;
  statusLabel: string;
  imageUrl?: string;
  sourceCard: ApiFlashcard;
}

interface FlashcardsApiResponse {
  flashcards?: ApiFlashcard[];
  error?: string;
  deletedCount?: number;
}

type ConfirmAction =
  | { kind: "delete-one"; card: NoteFlashcard }
  | { kind: "batch-delete" }
  | null;

const typeClassNames: Record<FlashcardType, string> = {
  qa: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200",
  cloze: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200",
  image: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200",
};

function toFlashcardType(type: string | null): FlashcardType {
  if (type === "cloze" || type === "image") {
    return type;
  }
  return "qa";
}

function formatStatusLabel(status: FlashcardStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function buildFlashcardPreview(card: ApiFlashcard): NoteFlashcard {
  const parsed = parseCardPayload(card);
  const type = toFlashcardType(card.card_type);
  const fallbackFront = card.content?.trim() ?? "Flashcard";
  const fallbackBack = card.description?.trim() ?? "";

  if (parsed?.type === "qa") {
    return {
      id: card.id,
      type: "qa",
      front: parsed.payload.prompt,
      backPreview: parsed.payload.response,
      statusLabel: formatStatusLabel(card.status),
      sourceCard: card,
    };
  }

  if (parsed?.type === "cloze") {
    return {
      id: card.id,
      type: "cloze",
      front: parsed.payload.sentence,
      backPreview: parsed.payload.blanks.join(", "),
      statusLabel: formatStatusLabel(card.status),
      sourceCard: card,
    };
  }

  if (parsed?.type === "image") {
    return {
      id: card.id,
      type: "image",
      front: card.description?.trim() ?? "Image flashcard",
      backPreview: parsed.payload.response ?? fallbackBack,
      statusLabel: formatStatusLabel(card.status),
      imageUrl: resolveCardImageSrc(parsed.payload.image_url),
      sourceCard: card,
    };
  }

  return {
    id: card.id,
    type,
    front: fallbackFront,
    backPreview: fallbackBack,
    statusLabel: formatStatusLabel(card.status),
    imageUrl:
      type === "image" && card.image_cid
        ? resolveCardImageSrc(card.image_cid)
        : undefined,
    sourceCard: card,
  };
}

async function fetchFlashcardsForPage(
  pageId: string,
  signal: AbortSignal,
): Promise<NoteFlashcard[]> {
  const response = await fetch(
    `/api/v1/pages/${encodeURIComponent(pageId)}/flashcards`,
    {
      method: "GET",
      cache: "no-store",
      signal,
    },
  );

  const body = (await response.json()) as FlashcardsApiResponse;
  if (!response.ok) {
    throw new Error(body.error ?? "Failed to fetch flashcards");
  }

  const cards = Array.isArray(body.flashcards) ? body.flashcards : [];
  return cards.map(buildFlashcardPreview);
}

function FlashcardsLoading() {
  return (
    <div className="space-y-3 p-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-lg border p-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-5/6" />
          <Skeleton className="mt-3 h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

function buildClozeEditorText(sentence: string, blanks: string[]): string {
  let index = 0;
  return sentence.replace(/_{3,}/g, () => {
    const value = blanks[index] ?? "blank";
    index += 1;
    return `{{${value}}}`;
  });
}

export function PageFlashcardsPanel() {
  const params = useParams();
  const pageId = typeof params.id === "string" ? params.id : undefined;
  const [isLoading, setIsLoading] = useState(false);
  const [flashcards, setFlashcards] = useState<NoteFlashcard[]>([]);
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [refreshTick, setRefreshTick] = useState(0);
  const [isMutating, setIsMutating] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editingCard, setEditingCard] = useState<NoteFlashcard | null>(null);
  const [editMode, setEditMode] = useState<EditMode>("qa");
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [clozeText, setClozeText] = useState("");
  const [imageResponse, setImageResponse] = useState("");
  const [imageUrlRaw, setImageUrlRaw] = useState("");
  const [imageAlt, setImageAlt] = useState<string | null>(null);
  const clozeTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const refreshCards = () => {
    setRefreshTick((prev) => prev + 1);
  };

  useEffect(() => {
    const onFlashcardCreated = (event: Event) => {
      const customEvent = event as CustomEvent<{ pageId?: string }>;
      if (customEvent.detail?.pageId === pageId) {
        refreshCards();
      }
    };

    window.addEventListener(
      "flashcard:created",
      onFlashcardCreated as EventListener,
    );
    return () => {
      window.removeEventListener(
        "flashcard:created",
        onFlashcardCreated as EventListener,
      );
    };
  }, [pageId]);

  useEffect(() => {
    if (!pageId || pageId.startsWith("temp-")) {
      setFlashcards([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadFlashcards = async () => {
      setIsLoading(true);
      try {
        const cards = await fetchFlashcardsForPage(pageId, controller.signal);
        if (!controller.signal.aborted) {
          setFlashcards(cards);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to load page flashcards:", error);
          setFlashcards([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadFlashcards();

    return () => {
      controller.abort();
    };
  }, [pageId, refreshTick]);

  const openEditDialog = (card: NoteFlashcard) => {
    const parsed = parseCardPayload(card.sourceCard);
    setEditingCard(card);

    if (parsed?.type === "qa") {
      setEditMode("qa");
      setQuestionText(parsed.payload.prompt);
      setAnswerText(parsed.payload.response);
      setClozeText("");
      setImageResponse("");
      setImageUrlRaw("");
      setImageAlt(null);
      setIsEditOpen(true);
      return;
    }

    if (parsed?.type === "cloze") {
      setEditMode("cloze");
      setQuestionText("");
      setAnswerText("");
      const editorText =
        card.sourceCard.content?.trim() ??
        buildClozeEditorText(parsed.payload.sentence, parsed.payload.blanks);
      setClozeText(editorText);
      setImageResponse("");
      setImageUrlRaw("");
      setImageAlt(null);
      setIsEditOpen(true);
      return;
    }

    if (parsed?.type === "image") {
      setEditMode("image");
      setQuestionText("");
      setAnswerText("");
      setClozeText("");
      setImageResponse(parsed.payload.response);
      setImageUrlRaw(parsed.payload.image_url);
      setImageAlt(parsed.payload.alt ?? null);
      setIsEditOpen(true);
      return;
    }

    setEditMode(card.type);
    setQuestionText(card.front);
    setAnswerText(card.backPreview);
    setClozeText(card.sourceCard.content?.trim() ?? "");
    setImageResponse(card.backPreview);
    setImageUrlRaw(card.sourceCard.image_cid ?? "");
    setImageAlt(null);
    setIsEditOpen(true);
  };

  const handleAddClozeFormatting = () => {
    const textarea = clozeTextareaRef.current;
    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start === end) {
      toast.error("Select text first");
      return;
    }

    const selected = clozeText.substring(start, end);
    const updated =
      clozeText.substring(0, start) +
      "{{" +
      selected +
      "}}" +
      clozeText.substring(end);
    setClozeText(updated);
  };

  const handleSaveEdit = async () => {
    if (!editingCard) {
      return;
    }

    try {
      setIsSavingEdit(true);
      const payloadVersion = editingCard.sourceCard.card_payload_version ?? 1;

      if (editMode === "qa") {
        if (!questionText.trim() || !answerText.trim()) {
          toast.error("Question and answer are required");
          return;
        }

        await updateCard({
          id: editingCard.id,
          cardPayload: buildQAPayload(questionText, answerText),
          cardPayloadVersion: payloadVersion,
          content: answerText.trim(),
        });
      } else if (editMode === "cloze") {
        if (!clozeText.trim()) {
          toast.error("Cloze text is required");
          return;
        }

        const clozeMatches = clozeText.match(/{{([^{}]+)}}/g);
        if (!clozeMatches) {
          toast.error("Use {{...}} to mark at least one blank");
          return;
        }

        const blanks = clozeMatches
          .map((match) => match.slice(2, -2).trim())
          .filter(Boolean);
        const sentence = clozeText.replace(/{{([^{}]+)}}/g, "_____").trim();

        await updateCard({
          id: editingCard.id,
          cardPayload: buildClozePayload(sentence, blanks),
          cardPayloadVersion: payloadVersion,
          content: clozeText.trim(),
        });
      } else {
        if (!imageResponse.trim()) {
          toast.error("Answer is required");
          return;
        }

        const parsedImagePayload = parseCardPayload(editingCard.sourceCard);
        const payloadImageUrl =
          parsedImagePayload?.type === "image"
            ? parsedImagePayload.payload.image_url
            : "";
        const sourceImage =
          [imageUrlRaw, editingCard.sourceCard.image_cid, payloadImageUrl].find(
            (value): value is string =>
              typeof value === "string" && value.trim().length > 0,
          ) ?? "";

        if (!sourceImage) {
          toast.error("Image source is missing");
          return;
        }

        await updateCard({
          id: editingCard.id,
          cardPayload: buildImagePayload(sourceImage, imageResponse, imageAlt),
          cardPayloadVersion: payloadVersion,
          content: imageResponse.trim(),
          description: imageResponse.trim(),
        });
      }

      toast.success("Flashcard updated");
      setIsEditOpen(false);
      setEditingCard(null);
      refreshCards();
    } catch (error) {
      console.error("Failed to edit flashcard:", error);
      toast.error("Failed to update flashcard");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleSuspendCard = async (card: NoteFlashcard) => {
    try {
      setIsMutating(true);
      await updateCard({
        id: card.id,
        status: "suspended",
        next_review: null,
      });
      toast.success("Flashcard suspended");
      refreshCards();
    } catch (error) {
      console.error("Failed to suspend flashcard:", error);
      toast.error("Failed to suspend flashcard");
    } finally {
      setIsMutating(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) {
      return;
    }
    if (confirmAction.kind === "batch-delete" && !pageId) {
      return;
    }

    try {
      setIsMutating(true);

      if (confirmAction.kind === "delete-one") {
        await deleteCard(confirmAction.card.id);
        toast.success("Flashcard deleted");
      } else {
        const response = await fetch(
          `/api/v1/pages/${encodeURIComponent(pageId!)}/flashcards`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
          },
        );
        const body = (await response.json()) as FlashcardsApiResponse;
        if (!response.ok) {
          throw new Error(body.error ?? "Failed to batch delete flashcards");
        }
        const deletedCount = body.deletedCount ?? 0;
        toast.success(
          deletedCount > 0
            ? `Deleted ${deletedCount} flashcards`
            : "No flashcards to delete",
        );
      }

      setConfirmAction(null);
      refreshCards();
    } catch (error) {
      console.error("Flashcard deletion failed:", error);
      toast.error("Failed to delete flashcards");
    } finally {
      setIsMutating(false);
    }
  };

  const editImagePreviewSrc = imageUrlRaw
    ? resolveCardImageSrc(imageUrlRaw)
    : undefined;

  const toggleCardExpanded = (cardId: string) => {
    setExpandedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {!!pageId && (
        <ScrollArea className="min-h-0 flex-1">
          {isLoading ? (
            <FlashcardsLoading />
          ) : flashcards.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground">
              No flashcards for this page yet.
            </div>
          ) : (
            <div className="space-y-3 p-3">
              {flashcards.map((card) => {
                const isExpanded = expandedCardIds.has(card.id);
                const canExpand =
                  card.front.length > 120 || card.backPreview.length > 80;

                return (
                  <article
                    key={card.id}
                    className="rounded-lg border bg-background p-3 transition-colors hover:bg-accent/20"
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] uppercase",
                              typeClassNames[card.type],
                            )}
                          >
                            {card.type}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                disabled={isMutating}
                                aria-label="Flashcard actions"
                              >
                                <Ellipsis className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                disabled={isMutating || flashcards.length === 0}
                                onClick={() =>
                                  setConfirmAction({ kind: "batch-delete" })
                                }
                              >
                                Batch delete flashcards
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                disabled={isMutating}
                                onClick={() =>
                                  setConfirmAction({ kind: "delete-one", card })
                                }
                              >
                                Delete flashcard
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={
                                  isMutating ||
                                  card.sourceCard.status === "suspended"
                                }
                                onClick={() => void handleSuspendCard(card)}
                              >
                                Suspend flashcard
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={isMutating}
                                onClick={() => openEditDialog(card)}
                              >
                                Edit flashcard
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <p
                          className={cn(
                            "mt-2 break-words text-sm font-medium leading-snug",
                            !isExpanded &&
                              "[display:-webkit-box] [overflow:hidden] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]",
                          )}
                        >
                          {card.front}
                        </p>
                        <p
                          className={cn(
                            "mt-1 break-words text-xs leading-snug text-muted-foreground",
                            !isExpanded &&
                              "[display:-webkit-box] [overflow:hidden] [-webkit-box-orient:vertical] [-webkit-line-clamp:1]",
                          )}
                        >
                          {card.backPreview}
                        </p>
                        {canExpand && (
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="mt-1 h-auto p-0 text-xs"
                            onClick={() => toggleCardExpanded(card.id)}
                          >
                            {isExpanded ? "Show less" : "Read more"}
                          </Button>
                        )}
                        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Clock3 className="h-3 w-3" />
                          <span>{card.statusLabel}</span>
                        </div>
                      </div>

                      {card.type === "image" && card.imageUrl && (
                        <div className="relative h-16 w-16 shrink-0 self-center overflow-hidden rounded-md border">
                          <Image
                            src={card.imageUrl}
                            alt="Flashcard image preview"
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </ScrollArea>
      )}

      <Dialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.kind === "batch-delete"
                ? "Batch Delete Flashcards"
                : "Delete Flashcard"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.kind === "batch-delete"
                ? "This will delete all flashcards on this page. This action cannot be undone."
                : "This will delete the selected flashcard. This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isMutating}
              onClick={() => setConfirmAction(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isMutating}
              onClick={() => void handleConfirmAction()}
            >
              {isMutating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          if (!isSavingEdit) {
            setIsEditOpen(open);
            if (!open) {
              setEditingCard(null);
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Flashcard</DialogTitle>
            <DialogDescription>
              Update this flashcard using the same fields used to create it.
            </DialogDescription>
          </DialogHeader>

          {editMode === "qa" && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="edit-question">Question</Label>
                <Textarea
                  id="edit-question"
                  value={questionText}
                  onChange={(event) => setQuestionText(event.target.value)}
                  placeholder="Enter the question"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-answer">Answer</Label>
                <Textarea
                  id="edit-answer"
                  value={answerText}
                  onChange={(event) => setAnswerText(event.target.value)}
                  placeholder="Enter the answer"
                  rows={3}
                />
              </div>
            </div>
          )}

          {editMode === "cloze" && (
            <div className="space-y-3 pt-2">
              <Label htmlFor="edit-cloze">Text with Cloze Deletions</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={handleAddClozeFormatting}
              >
                Add Cloze Brackets
              </Button>
              <Textarea
                id="edit-cloze"
                ref={clozeTextareaRef}
                value={clozeText}
                onChange={(event) => setClozeText(event.target.value)}
                placeholder="Example: The capital of France is {{Paris}}."
                rows={6}
              />
            </div>
          )}

          {editMode === "image" && (
            <div className="space-y-3 pt-2">
              {editImagePreviewSrc && (
                <div className="relative h-40 w-full overflow-hidden rounded-md border">
                  <Image
                    src={editImagePreviewSrc}
                    alt="Flashcard image"
                    fill
                    sizes="560px"
                    className="object-contain"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="edit-image-answer">Answer</Label>
                <Textarea
                  id="edit-image-answer"
                  value={imageResponse}
                  onChange={(event) => setImageResponse(event.target.value)}
                  placeholder="Enter answer for image flashcard..."
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              disabled={isSavingEdit}
              onClick={() => {
                setIsEditOpen(false);
                setEditingCard(null);
              }}
            >
              Cancel
            </Button>
            <Button disabled={isSavingEdit} onClick={() => void handleSaveEdit()}>
              {isSavingEdit ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
