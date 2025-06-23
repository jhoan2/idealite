// src/app/api/v1/pages/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { pages, users_pages } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";

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
      created_at: page.created_at,
      updated_at: page.updated_at,
    });
  } catch (error) {
    console.error("Error fetching page:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/v1/pages/[id] - Update page
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

    // Prepare update data
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
      id: updatedPage[0].id,
      title: updatedPage[0].title,
      content: updatedPage[0].content,
      content_type: updatedPage[0].content_type,
      updated_at: updatedPage[0].updated_at,
    });
  } catch (error) {
    console.error("Error updating page:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
