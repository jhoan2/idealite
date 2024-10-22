import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { users_tags } from "~/server/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { userId, addedTags, removedTags } = await req.json();

    if (!userId || !Array.isArray(addedTags) || !Array.isArray(removedTags)) {
      return NextResponse.json(
        { message: "Invalid request body" },
        { status: 400 },
      );
    }

    // Start a transaction
    await db.transaction(async (tx) => {
      // Add new tags
      if (addedTags.length > 0) {
        await tx.insert(users_tags).values(
          addedTags.map((tag) => ({
            user_id: userId,
            tag_id: typeof tag === "string" ? tag : tag.id,
          })),
        );
      }

      // Remove tags
      if (removedTags.length > 0) {
        await tx.delete(users_tags).where(
          and(
            eq(users_tags.user_id, userId),
            inArray(
              users_tags.tag_id,
              removedTags.map((tag) =>
                typeof tag === "string" ? tag : tag.id,
              ),
            ),
          ),
        );
      }
    });

    return NextResponse.json({ message: "User tags updated successfully" });
  } catch (error) {
    console.error("Error updating user tags:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
