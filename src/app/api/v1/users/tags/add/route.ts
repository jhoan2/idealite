// src/app/api/v1/users/tags/add/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { addUserTag } from "~/server/actions/usersTags";
import * as Sentry from "@sentry/nextjs";

const addUserTagSchema = z.object({
  tagId: z.string().uuid("Invalid tag ID format"),
});

export async function POST(request: NextRequest) {
  try {
    // 1) Authenticate the user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2) Parse and validate request body
    const body = await request.json();
    const { tagId } = addUserTagSchema.parse(body);

    // 3) Call the existing server action
    const result = await addUserTag(tagId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to add tag" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tag added successfully",
      data: {
        tagId: tagId,
        userId: userId,
      },
    });
  } catch (error) {
    console.error("Error adding user tag:", error);

    Sentry.captureException(error, {
      tags: {
        api: "users",
        endpoint: "/api/v1/users/tags/add",
        operation: "add-user-tag",
      },
      extra: {
        userId: await auth()
          .then((auth) => auth.userId)
          .catch(() => null),
        requestBody: await request
          .clone()
          .json()
          .catch(() => null),
      },
    });

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    // Handle specific server action errors
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (error.message.includes("not found")) {
        return NextResponse.json({ error: "Tag not found" }, { status: 404 });
      }

      if (error.message.includes("already exists")) {
        return NextResponse.json(
          { error: "Tag already added to user" },
          { status: 409 },
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
