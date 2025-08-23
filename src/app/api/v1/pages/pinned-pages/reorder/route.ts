// src/app/api/v1/pages/pinned-pages/reorder/route.ts
import { NextRequest, NextResponse } from "next/server";
import { reorderPinnedPages } from "~/server/actions/pinnedPages";
import { currentUser } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";

const reorderPagesSchema = z.object({
  pageIds: z.array(z.string().uuid()),
});

// PUT /api/v1/pinned-pages/reorder - Reorder pinned pages
export async function PUT(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { pageIds } = reorderPagesSchema.parse(body);

    const result = await reorderPinnedPages({ pageIds });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering pinned pages:", error);
    Sentry.captureException(error, {
      tags: { api: "pinned-pages", operation: "reorder" },
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
