// src/app/api/v1/pages/[id]/resources/[resourceId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import {
  users_pages,
  resourcesPages,
  usersResources,
} from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";

// DELETE /api/v1/pages/[id]/resources/[resourceId] - Delete resource from page
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; resourceId: string } },
) {
  let userId: string | undefined;

  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    userId = user.externalId; // Store userId to avoid type issues
    const pageId = params.id;
    const resourceId = params.resourceId;

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

    // Check if the resource-page relationship exists
    const resourcePage = await db.query.resourcesPages.findFirst({
      where: and(
        eq(resourcesPages.resource_id, resourceId),
        eq(resourcesPages.page_id, pageId),
      ),
    });

    if (!resourcePage) {
      return NextResponse.json(
        { error: "Resource not found on this page" },
        { status: 404 },
      );
    }

    // Perform deletion in a transaction
    await db.transaction(async (tx) => {
      // 1. Delete the resource-page relationship
      await tx
        .delete(resourcesPages)
        .where(
          and(
            eq(resourcesPages.resource_id, resourceId),
            eq(resourcesPages.page_id, pageId),
          ),
        );

      // 2. Delete the user-resource relationship
      await tx
        .delete(usersResources)
        .where(
          and(
            eq(usersResources.resource_id, resourceId),
            eq(usersResources.user_id, userId!),
          ),
        );
    });

    return NextResponse.json({
      success: true,
      message: "Resource deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting resource:", error);
    Sentry.captureException(error, {
      tags: { api: "pages", operation: "delete_resource" },
      extra: {
        pageId: params.id,
        resourceId: params.resourceId,
        userId: userId,
      },
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
