// src/app/api/v1/cards/process/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { processFlashCards } from "~/server/actions/card";
import * as Sentry from "@sentry/nextjs";

const cardUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["active", "mastered", "suspended"]),
  next_review: z.string().datetime().nullable(),
  last_reviewed: z.string().datetime(),
});

const processCardsSchema = z.object({
  updates: z.array(cardUpdateSchema),
});

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { updates } = processCardsSchema.parse(body);

    // Call your existing server action
    const result = await processFlashCards(updates);

    return NextResponse.json({
      success: true,
      message: "Flashcards processed successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error processing flashcards:", error);

    Sentry.captureException(error, {
      tags: {
        api: "flashcards",
        endpoint: "/api/v1/flashcards/process",
      },
      extra: {
        userId: await currentUser()
          .then((user) => user?.externalId)
          .catch(() => null),
      },
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to process flashcards" },
      { status: 500 },
    );
  }
}
