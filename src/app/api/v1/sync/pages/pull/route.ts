// src/app/api/v1/sync/pages/pull/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { pages, users_pages } from "~/server/db/schema";
import { eq, and, gt, desc } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.externalId;
    const { searchParams } = new URL(request.url);
    const sinceParam = searchParams.get("since");

    // Parse since timestamp, default to very old date if not provided
    let sinceDate: Date;
    try {
      sinceDate = sinceParam ? new Date(sinceParam) : new Date("1970-01-01");
      if (isNaN(sinceDate.getTime())) {
        throw new Error("Invalid date");
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid 'since' timestamp" },
        { status: 400 },
      );
    }

    // Get current server timestamp for next sync
    const serverTimestamp = new Date().toISOString();

    const updatedPages = await db
      .select({
        id: pages.id,
        title: pages.title,
        content: pages.content,
        content_type: pages.content_type,
        description: pages.description,
        image_previews: pages.image_previews,
        created_at: pages.created_at,
        updated_at: pages.updated_at,
        deleted: pages.deleted,
      })
      .from(pages)
      .innerJoin(users_pages, eq(users_pages.page_id, pages.id))
      .where(
        and(
          eq(users_pages.user_id, userId),
          gt(pages.updated_at, sinceDate),
          eq(pages.deleted, false),
        ),
      )
      .orderBy(desc(pages.updated_at));

    // Transform the data including metadata fields
    const transformedPages = updatedPages.map((page) => ({
      id: page.id,
      title: page.title,
      content: page.content,
      content_type: page.content_type,
      description: page.description,
      image_previews: page.image_previews || [], // Ensure array even if null
      created_at: page.created_at?.toISOString() || "",
      updated_at: page.updated_at?.toISOString() || "",
      deleted: page.deleted || false,
    }));

    return NextResponse.json({
      success: true,
      pages: transformedPages,
      server_timestamp: serverTimestamp,
      pulled_count: transformedPages.length,
    });
  } catch (error) {
    console.error("Error in sync pull:", error);
    Sentry.captureException(error, {
      tags: { api: "sync", operation: "pull" },
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
