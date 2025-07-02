// src/app/api/v1/pages/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { pages, users_pages, cards } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { saveCanvasData } from "~/server/actions/canvas";
import { getPageTags } from "~/server/queries/page";
import { getResourcesForPage } from "~/server/queries/resource";
import { getUserTagTree } from "~/server/queries/usersTags";
import * as Sentry from "@sentry/nextjs";

// Helper function to get flashcards for a page
async function getPageFlashcards(pageId: string, userId: string) {
  try {
    const flashcards = await db.query.cards.findMany({
      where: and(
        eq(cards.page_id, pageId),
        eq(cards.user_id, userId),
        eq(cards.deleted, false),
      ),
      orderBy: (cards, { desc }) => [desc(cards.created_at)],
    });

    return flashcards;
  } catch (error) {
    console.error("Error fetching page flashcards:", error);
    Sentry.captureException(error, {
      tags: { component: "getPageFlashcards" },
      extra: { pageId, userId },
    });
    return [];
  }
}

// GET /api/v1/pages/[id] - Get enhanced page data with tags, resources, tag tree, and flashcards
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

    // Fetch additional data in parallel
    const [pageTags, pageResources, userTagTree, pageFlashcards] =
      await Promise.all([
        getPageTags(pageId),
        getResourcesForPage(pageId),
        getUserTagTree(user.externalId),
        getPageFlashcards(pageId, user.externalId),
      ]);

    return NextResponse.json({
      // Basic page data
      id: page.id,
      title: page.title,
      content: page.content,
      content_type: page.content_type,
      canvas_image_cid: page.canvas_image_cid,
      created_at: page.created_at,
      updated_at: page.updated_at,

      // Enhanced data for PageHeader functionality
      tags: pageTags,
      resources: pageResources,
      userTagTree: userTagTree,
      flashcards: pageFlashcards,
    });
  } catch (error) {
    console.error("Error fetching enhanced page data:", error);
    Sentry.captureException(error, {
      tags: { api: "pages", operation: "get_enhanced" },
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
