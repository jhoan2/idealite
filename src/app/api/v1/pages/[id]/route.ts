// src/app/api/v1/pages/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { pages, users_pages } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { saveCanvasData } from "~/server/actions/canvas";
import * as Sentry from "@sentry/nextjs";

// GET /api/v1/pages/[id] - Get basic page data
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pageId = params.id;

    // Check if user has access to this page
    const userPage = await db.query.users_pages.findFirst({
      where: and(
        eq(users_pages.page_id, pageId),
        eq(users_pages.user_id, user.externalId),
      ),
    });

    if (!userPage) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Get the page
    const page = await db.query.pages.findFirst({
      where: and(eq(pages.id, pageId), eq(pages.deleted, false)),
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: page.id,
      title: page.title,
      content: page.content,
      content_type: page.content_type,
      canvas_image_cid: page.canvas_image_cid,
      created_at: page.created_at,
      updated_at: page.updated_at,
    });
  } catch (error) {
    console.error("Error fetching page:", error);
    Sentry.captureException(error, {
      tags: { api: "pages", operation: "get" },
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/v1/pages/[id] - Update page (enhanced for canvas)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pageId = params.id;
    const body = await request.json();

    // Check if user has access to this page
    const userPage = await db.query.users_pages.findFirst({
      where: and(
        eq(users_pages.page_id, pageId),
        eq(users_pages.user_id, user.externalId),
      ),
    });

    if (!userPage) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Get current page to check content_type
    const currentPage = await db.query.pages.findFirst({
      where: and(eq(pages.id, pageId), eq(pages.deleted, false)),
    });

    if (!currentPage) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Handle canvas-specific updates
    if (currentPage.content_type === "canvas" && body.content) {
      const {
        content: snapshot,
        assetMetadata = [],
        canvasImageCid = null,
        tagIds = [],
      } = body;

      try {
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

        // Get updated page data for server-generated fields
        const updatedPage = await db.query.pages.findFirst({
          where: eq(pages.id, pageId),
        });

        return NextResponse.json({
          success: true,
          updated_at: updatedPage?.updated_at,
          canvas_image_cid: updatedPage?.canvas_image_cid,
          canvas_result: {
            created: result.created,
            deleted: result.deleted,
          },
        });
      } catch (error) {
        console.error("Error saving canvas:", error);
        Sentry.captureException(error, {
          tags: { api: "pages", operation: "canvas-save" },
        });
        return NextResponse.json(
          { error: "Failed to save canvas" },
          { status: 500 },
        );
      }
    }

    // Handle regular page updates
    const updateData: Partial<{
      title: string;
      content: string;
      updated_at: Date;
    }> = {
      updated_at: new Date(),
    };

    // Only update fields that are provided
    if (body.title !== undefined) {
      updateData.title = body.title;
    }

    if (body.content !== undefined) {
      updateData.content = body.content;
    }

    // Update the page
    const updatedPage = await db
      .update(pages)
      .set(updateData)
      .where(eq(pages.id, pageId))
      .returning();

    if (!updatedPage[0]) {
      return NextResponse.json(
        { error: "Failed to update page" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      updated_at: updatedPage[0].updated_at, // Only server-generated field
    });
  } catch (error) {
    console.error("Error updating page:", error);
    Sentry.captureException(error, {
      tags: { api: "pages", operation: "update" },
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
