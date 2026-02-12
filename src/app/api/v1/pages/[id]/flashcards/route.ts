import { currentUser } from "@clerk/nextjs/server";
import { and, eq, inArray } from "drizzle-orm";
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pageId = params.id;
    if (pageId.startsWith("temp-")) {
      return NextResponse.json({ deletedCount: 0 });
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

    let cardIds: string[] | undefined;
    try {
      const body = (await request.json()) as { cardIds?: unknown };
      if (Array.isArray(body.cardIds)) {
        const parsed = body.cardIds.filter(
          (value): value is string => typeof value === "string" && value.length > 0,
        );
        cardIds = parsed;
      }
    } catch {
      // No body means "delete all flashcards on this page".
    }

    if (Array.isArray(cardIds) && cardIds.length === 0) {
      return NextResponse.json({ deletedCount: 0 });
    }

    const whereConditions = [
      eq(cards.user_id, user.externalId),
      eq(cards.page_id, pageId),
      eq(cards.deleted, false),
    ];

    if (cardIds && cardIds.length > 0) {
      whereConditions.push(inArray(cards.id, cardIds));
    }

    const deletedRows = await db
      .update(cards)
      .set({
        deleted: true,
        updated_at: new Date(),
      })
      .where(and(...whereConditions))
      .returning({ id: cards.id });

    return NextResponse.json({ deletedCount: deletedRows.length });
  } catch (error) {
    console.error("Error deleting page flashcards:", error);
    return NextResponse.json(
      { error: "Failed to delete page flashcards" },
      { status: 500 },
    );
  }
}
