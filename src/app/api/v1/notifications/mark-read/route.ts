// src/app/api/v1/notifications/mark-read/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { markMultipleNotificationsAsRead } from "~/server/queries/notification";

const markReadSchema = z.object({
  notificationIds: z
    .array(z.string().uuid())
    .min(1, "At least one notification ID is required")
    .max(100, "Cannot mark more than 100 notifications at once"),
});

export async function PATCH(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds } = markReadSchema.parse(body);

    // Mark notifications as read using existing server query
    await markMultipleNotificationsAsRead(notificationIds);

    return NextResponse.json({
      message: "Notifications marked as read successfully",
      count: notificationIds.length,
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);

    Sentry.captureException(error, {
      tags: {
        api: "notifications",
        endpoint: "/api/v1/notifications/mark-read",
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
      { error: "Failed to mark notifications as read" },
      { status: 500 },
    );
  }
}
