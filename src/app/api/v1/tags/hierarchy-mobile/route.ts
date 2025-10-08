// src/app/api/v1/tags/hierarchy-mobile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getTagHierarchyForUserExcludingRoot } from "~/server/queries/dashboard";
import * as Sentry from "@sentry/nextjs";

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    const userId = user?.externalId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tagTree = await getTagHierarchyForUserExcludingRoot();

    return NextResponse.json({
      success: true,
      data: tagTree,
    });
  } catch (error) {
    console.error("Error fetching mobile tag hierarchy:", error);

    Sentry.captureException(error, {
      tags: {
        component: "mobile-tag-hierarchy-api",
        operation: "fetch-hierarchy",
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch tag hierarchy",
      },
      { status: 500 },
    );
  }
}
