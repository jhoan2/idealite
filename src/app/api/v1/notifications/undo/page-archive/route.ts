// src/app/api/v1/notifications/undo/page-archive/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { undoPageArchive } from "~/server/actions/autoArchive";

const undoPageArchiveSchema = z.object({
  notificationId: z.string().uuid("Invalid notification ID format"),
});

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId } = undoPageArchiveSchema.parse(body);

    // Call your existing server action
    const result = await undoPageArchive(notificationId);

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to undo page archive" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Page archive action has been undone",
    });
  } catch (error) {
    console.error("Error undoing page archive:", error);

    Sentry.captureException(error, {
      tags: {
        api: "notifications",
        endpoint: "/api/v1/notifications/undo/page-archive",
        operation: "undo-page-archive",
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
      { error: "Failed to undo page archive" },
      { status: 500 },
    );
  }
}
