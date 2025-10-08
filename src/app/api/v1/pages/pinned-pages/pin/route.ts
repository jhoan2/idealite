// src/app/api/v1/pages/pinned-pages/pin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pinPage } from "~/server/actions/pinnedPages";
import { currentUser } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";

const pinPageSchema = z.object({
  pageId: z.string().uuid(),
});

// POST /api/v1/pinned-pages/pin - Pin a page
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { pageId } = pinPageSchema.parse(body);

    const result = await pinPage({ pageId });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error pinning page:", error);
    Sentry.captureException(error, {
      tags: { api: "pinned-pages", operation: "pin" },
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
