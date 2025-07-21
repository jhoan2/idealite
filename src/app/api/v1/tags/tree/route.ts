// app/api/v1/tags/tree/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getUserTagTree } from "~/server/queries/usersTags";
import * as Sentry from "@sentry/nextjs";

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    const userId = user?.externalId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tagTree = await getUserTagTree(userId);

    return NextResponse.json({
      success: true,
      data: tagTree,
    });
  } catch (error) {
    console.error("Error fetching tag tree:", error);

    Sentry.captureException(error, {
      tags: {
        component: "v1-tag-tree-api",
        operation: "fetch-tree",
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch tag tree",
      },
      { status: 500 },
    );
  }
}
