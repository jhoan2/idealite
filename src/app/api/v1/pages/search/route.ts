import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { pages, users_pages } from "~/server/db/schema";
import { and, eq, desc, ilike } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.externalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (query.length < 2) {
      // Return recent pages when query is too short
      const recentPages = await db
        .select({
          id: pages.id,
          title: pages.title,
        })
        .from(pages)
        .innerJoin(users_pages, eq(pages.id, users_pages.page_id))
        .where(
          and(
            eq(users_pages.user_id, user.externalId),
            eq(pages.deleted, false)
          )
        )
        .orderBy(desc(pages.updated_at))
        .limit(10);

      return NextResponse.json(recentPages);
    }

    // Search pages by title using ILIKE for case-insensitive search
    const searchResults = await db
      .select({
        id: pages.id,
        title: pages.title,
      })
      .from(pages)
      .innerJoin(users_pages, eq(pages.id, users_pages.page_id))
      .where(
        and(
          eq(users_pages.user_id, user.externalId),
          eq(pages.deleted, false),
          ilike(pages.title, `%${query}%`)
        )
      )
      .orderBy(desc(pages.updated_at))
      .limit(10);

    return NextResponse.json(searchResults);
  } catch (error) {
    console.error("Error searching pages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}