import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { cards, users_pages } from "~/server/db/schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pageId = params.id;

    // Unsynced local-only notes cannot have server flashcards yet.
    if (pageId.startsWith("temp-")) {
      return NextResponse.json({ flashcards: [] });
    }

    const ownedPage = await db.query.users_pages.findFirst({
      where: and(
        eq(users_pages.page_id, pageId),
        eq(users_pages.user_id, user.externalId),
      ),
      columns: { page_id: true },
    });

    if (!ownedPage) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const flashcards = await db.query.cards.findMany({
      where: and(
        eq(cards.user_id, user.externalId),
        eq(cards.page_id, pageId),
        eq(cards.deleted, false),
      ),
      columns: {
        id: true,
        card_type: true,
        card_payload: true,
        content: true,
        image_cid: true,
        description: true,
        next_review: true,
        status: true,
        created_at: true,
      },
      orderBy: (table, { desc }) => [desc(table.created_at)],
    });

    return NextResponse.json({ flashcards });
  } catch (error) {
    console.error("Error fetching page flashcards:", error);
    return NextResponse.json(
      { error: "Failed to fetch page flashcards" },
      { status: 500 },
    );
  }
}

