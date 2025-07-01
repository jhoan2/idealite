import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { users_pages } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";
import { createResource } from "~/server/actions/resource";

// POST /api/v1/pages/[id]/resources - Create resource and associate with page
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.externalId;
    const pageId = params.id;

    // Check if user has access to this page
    const userPage = await db.query.users_pages.findFirst({
      where: and(
        eq(users_pages.page_id, pageId),
        eq(users_pages.user_id, userId),
      ),
    });

    if (!userPage) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();

    // Add page_id to the input for the server action
    const resourceInput = {
      ...body,
      page_id: pageId,
      // Convert date string to Date object if present
      date_published: body.date_published
        ? new Date(body.date_published)
        : undefined,
    };

    // Call your existing server action
    const resource = await createResource(resourceInput);

    return NextResponse.json({
      success: true,
      message: "Resource created successfully",
      resource: resource,
    });
  } catch (error) {
    console.error("Error in API route:", error);

    Sentry.captureException(error, {
      tags: { api: "pages", operation: "create_resource" },
      extra: {
        pageId: params.id,
      },
    });

    // Check if it's a validation error from the server action
    if (error instanceof Error && error.message.includes("Validation failed")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Check if it's an auth error from the server action
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
