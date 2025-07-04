// src/app/api/v1/cards/due/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getDueFlashCards } from "~/server/queries/card";

import * as Sentry from "@sentry/nextjs";

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status =
      (searchParams.get("status") as
        | "active"
        | "mastered"
        | "suspended"
        | "all") || "active";
    const tags = searchParams.getAll("tags");
    const limitParam = searchParams.get("limit");
    const getCardsParam = searchParams.get("getCards");

    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    const getCards = getCardsParam === "true";

    // Call your existing server query
    const result = await getDueFlashCards({
      status,
      tags,
      limit,
      getCards,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching due flashcards:", error);

    Sentry.captureException(error, {
      tags: {
        api: "flashcards",
        endpoint: "/api/v1/flashcards/due",
      },
      extra: {
        userId: await currentUser()
          .then((user) => user?.externalId)
          .catch(() => null),
      },
    });

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to fetch due flashcards" },
      { status: 500 },
    );
  }
}
