"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Skeleton } from "~/components/ui/skeleton";
import { Clock3 } from "lucide-react";
import { cn } from "~/lib/utils";
import { parseCardPayload, resolveCardImageSrc } from "~/lib/flashcards/cardPayload";

type FlashcardType = "qa" | "cloze" | "image";

interface NoteFlashcard {
  id: string;
  type: FlashcardType;
  front: string;
  backPreview: string;
  dueLabel: string;
  statusLabel: string;
  imageUrl?: string;
}

type FlashcardStatus = "active" | "mastered" | "suspended";

interface ApiFlashcard {
  id: string;
  card_type: string | null;
  card_payload: unknown;
  content: string | null;
  image_cid: string | null;
  description: string | null;
  next_review: string | null;
  status: FlashcardStatus;
}

interface FlashcardsApiResponse {
  flashcards?: ApiFlashcard[];
  error?: string;
}

function formatDueLabel(nextReviewIso: string | null): string {
  if (!nextReviewIso) {
    return "No due date";
  }

  const dueDate = new Date(nextReviewIso);
  if (Number.isNaN(dueDate.getTime())) {
    return "No due date";
  }

  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(
    dueDate.getFullYear(),
    dueDate.getMonth(),
    dueDate.getDate(),
  );
  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / dayMs);

  if (diffDays < 0) {
    return diffDays === -1 ? "Overdue by 1 day" : `Overdue by ${Math.abs(diffDays)} days`;
  }
  if (diffDays === 0) {
    return "Due today";
  }
  if (diffDays === 1) {
    return "Due tomorrow";
  }
  return `Due in ${diffDays} days`;
}

function formatStatusLabel(status: FlashcardStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function toFlashcardType(type: string | null): FlashcardType {
  if (type === "cloze" || type === "image") {
    return type;
  }
  return "qa";
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
      dueLabel: formatDueLabel(card.next_review),
      statusLabel: formatStatusLabel(card.status),
    };
  }

  if (parsed?.type === "cloze") {
    return {
      id: card.id,
      type: "cloze",
      front: parsed.payload.sentence,
      backPreview: parsed.payload.blanks.join(", "),
      dueLabel: formatDueLabel(card.next_review),
      statusLabel: formatStatusLabel(card.status),
    };
  }

  if (parsed?.type === "image") {
    return {
      id: card.id,
      type: "image",
      front: card.description?.trim() ?? "Image flashcard",
      backPreview: parsed.payload.response ?? fallbackBack,
      dueLabel: formatDueLabel(card.next_review),
      statusLabel: formatStatusLabel(card.status),
      imageUrl: resolveCardImageSrc(parsed.payload.image_url),
    };
  }

  return {
    id: card.id,
    type,
    front: fallbackFront,
    backPreview: fallbackBack,
    dueLabel: formatDueLabel(card.next_review),
    statusLabel: formatStatusLabel(card.status),
    imageUrl: type === "image" && card.image_cid ? resolveCardImageSrc(card.image_cid) : undefined,
  };
}

async function fetchFlashcardsForPage(
  pageId: string,
  signal: AbortSignal,
): Promise<NoteFlashcard[]> {
  const response = await fetch(`/api/v1/pages/${encodeURIComponent(pageId)}/flashcards`, {
    method: "GET",
    cache: "no-store",
    signal,
  });

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

const typeClassNames: Record<FlashcardType, string> = {
  qa: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200",
  cloze: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200",
  image: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200",
};

export function PageFlashcardsPanel() {
  const params = useParams();
  const pageId = typeof params.id === "string" ? params.id : undefined;
  const [isLoading, setIsLoading] = useState(false);
  const [flashcards, setFlashcards] = useState<NoteFlashcard[]>([]);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const onFlashcardCreated = (event: Event) => {
      const customEvent = event as CustomEvent<{ pageId?: string }>;
      if (customEvent.detail?.pageId === pageId) {
        setRefreshTick((prev) => prev + 1);
      }
    };

    window.addEventListener("flashcard:created", onFlashcardCreated as EventListener);
    return () => {
      window.removeEventListener("flashcard:created", onFlashcardCreated as EventListener);
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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {!!pageId && (
        <ScrollArea className="min-h-0 flex-1">
          {isLoading ? (
            <FlashcardsLoading />
          ) : (
            <div className="space-y-3 p-3">
              {flashcards.map((card) => (
                <article
                  key={card.id}
                  className="rounded-lg border bg-background p-3 transition-colors hover:bg-accent/20"
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] uppercase", typeClassNames[card.type])}
                        >
                          {card.type}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">{card.dueLabel}</span>
                      </div>
                      <p className="mt-2 text-sm font-medium leading-snug">{card.front}</p>
                      <p className="mt-1 text-xs leading-snug text-muted-foreground">
                        {card.backPreview}
                      </p>
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
              ))}
            </div>
          )}
        </ScrollArea>
      )}
    </div>
  );
}
