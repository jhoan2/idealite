// src/app/api/v1/pages/[id]/canvas/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { saveCanvasData } from "~/server/actions/canvas";
import * as Sentry from "@sentry/nextjs";
import { auth } from "@clerk/nextjs/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // 1) Authenticate the user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2) Parse request body
    const pageId = params.id;
    const {
      content: snapshot,
      assetMetadata = [],
      canvasImageCid = null,
      tagIds = [],
    } = await request.json();

    // 3) Validate required data
    if (!snapshot) {
      return NextResponse.json(
        { error: "Missing required field: content" },
        { status: 400 },
      );
    }

    // 4) Save canvas data
    const result = await saveCanvasData(
      pageId,
      snapshot,
      assetMetadata,
      canvasImageCid,
      tagIds,
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to save canvas" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      created: result.created,
      deleted: result.deleted,
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { api: "canvas-save" },
      extra: { pageId: params.id },
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
