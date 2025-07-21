// src/app/api/v1/pages/[id]/title/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPageTitle } from "~/server/queries/page";
import { updatePageTitle } from "~/server/actions/page"; // Import the server action

// GET /api/v1/pages/[id]/title - Get just the page title
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const pageId = params.id;

    // Use your existing server action
    const title = await getPageTitle(pageId);

    return NextResponse.json({
      id: pageId,
      title: title || "Untitled",
    });
  } catch (error) {
    console.error("Error fetching page title:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH /api/v1/pages/[id]/title - Update just the page title
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const pageId = params.id;
    const body = await request.json();
    const { title } = body;

    // Basic validation before calling server action
    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Valid title is required" },
        { status: 400 },
      );
    }

    // Use the server action - it handles all authorization, validation, and database operations
    const updatedTitle = await updatePageTitle(pageId, title);

    return NextResponse.json({
      id: pageId,
      title: updatedTitle,
    });
  } catch (error) {
    console.error("Error updating page title:", error);

    // Handle specific error types from the server action
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (
        error.message.includes("not found") ||
        error.message.includes("no access")
      ) {
        return NextResponse.json({ error: "Page not found" }, { status: 404 });
      }

      if (
        error.message.includes("title is required") ||
        error.message.includes("cannot exceed")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
