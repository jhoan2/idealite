// src/app/api/v1/notifications/counts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { getNotificationCounts } from "~/server/queries/notification";

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get notification counts using existing server query
    const counts = await getNotificationCounts();

    return NextResponse.json(counts);
  } catch (error) {
    console.error("Error fetching notification counts:", error);

    Sentry.captureException(error, {
      tags: {
        api: "notifications",
        endpoint: "/api/v1/notifications/counts",
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
      { error: "Failed to fetch notification counts" },
      { status: 500 },
    );
  }
}
