// app/api/v1/users/tags/route.ts - Dedicated user-tags endpoint with Sentry
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { db } from "~/server/db";
import { users, users_tags } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";

// GET - Fetch user's current tags
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user by clerk_id to get the database user ID
    const user = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerk_id, userId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's current tags
    const userTags = await db
      .select({
        tag_id: users_tags.tag_id,
        is_collapsed: users_tags.is_collapsed,
        is_archived: users_tags.is_archived,
        created_at: users_tags.created_at,
      })
      .from(users_tags)
      .where(eq(users_tags.user_id, user[0]?.id ?? ""));

    return NextResponse.json(userTags);
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Set user's tags (for onboarding)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const { tagIds, completeOnboarding = false } = body;

    if (!tagIds || !Array.isArray(tagIds)) {
      return NextResponse.json(
        { error: "tagIds array is required" },
        { status: 400 },
      );
    }

    // Find user by clerk_id to get the database user ID
    const user = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerk_id, userId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userRecord = user[0]!;

    // If completing onboarding, update the user record first
    if (completeOnboarding) {
      await db
        .update(users)
        .set({
          is_onboarded: true,
          updated_at: new Date(),
        })
        .where(eq(users.id, userRecord.id));
    }

    // Insert new user-tag relationships
    if (tagIds.length > 0) {
      const userTagInserts = tagIds.map((tagId: string) => ({
        user_id: userRecord.id,
        tag_id: tagId,
        is_collapsed: false,
        is_archived: false,
      }));

      await db.insert(users_tags).values(userTagInserts);
    }

    return NextResponse.json({
      message: "User tags updated successfully",
      tagCount: tagIds.length,
      onboardingCompleted: completeOnboarding,
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// PATCH - Update specific user-tag relationships (for editing)
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const { tagId, is_collapsed, is_archived } = body;

    if (!tagId) {
      return NextResponse.json({ error: "tagId is required" }, { status: 400 });
    }

    // Find user by clerk_id
    const user = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerk_id, userId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update the specific user-tag relationship
    const updatedUserTag = await db
      .update(users_tags)
      .set({
        ...(is_collapsed !== undefined && { is_collapsed }),
        ...(is_archived !== undefined && { is_archived }),
      })
      .where(
        and(
          eq(users_tags.user_id, user[0]?.id ?? ""),
          eq(users_tags.tag_id, tagId),
        ),
      )
      .returning();

    if (updatedUserTag.length === 0) {
      return NextResponse.json(
        { error: "User tag relationship not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(updatedUserTag[0]);
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
