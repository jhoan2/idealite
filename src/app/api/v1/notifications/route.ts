// src/app/api/v1/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import {
  getUserNotificationsPaginated,
  getNotificationsByStatus,
} from "~/server/queries/notification";

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const cursor = searchParams.get("cursor");
    const status = searchParams.get("status") as
      | "unread"
      | "read"
      | "reversed"
      | "expired"
      | null;

    // Default to smaller page size for mobile
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    // Validate limit
    if (isNaN(limit) || limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: "Limit must be between 1 and 50" },
        { status: 400 },
      );
    }

    let result;

    // Fetch notifications based on whether status filter is provided
    if (status) {
      // Validate status
      if (!["unread", "read", "reversed", "expired"].includes(status)) {
        return NextResponse.json(
          {
            error:
              "Invalid status. Must be: unread, read, reversed, or expired",
          },
          { status: 400 },
        );
      }

      result = await getNotificationsByStatus(
        status,
        limit,
        cursor || undefined,
      );
    } else {
      // Get all notifications
      result = await getUserNotificationsPaginated(limit, cursor || undefined);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching notifications:", error);

    Sentry.captureException(error, {
      tags: {
        api: "notifications",
        endpoint: "/api/v1/notifications",
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
      { error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}
