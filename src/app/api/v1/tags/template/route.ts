// app/api/v1/tags/template/route.ts - Simple version for testing
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { tags } from "~/server/db/schema";
import { eq, and, ne } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const ROOT_TAG_ID = "fbb1f204-6500-4b60-ab64-e1a9b3a5da88";
    // Fetch all template tags that are not deleted
    const templateTags = await db
      .select({
        id: tags.id,
        name: tags.name,
      })
      .from(tags)
      .where(
        and(
          eq(tags.is_template, true),
          eq(tags.deleted, false),
          ne(tags.id, ROOT_TAG_ID),
        ),
      )
      .orderBy(tags.name);

    return NextResponse.json(templateTags);
  } catch (error) {
    console.error("🔴 Error fetching template tags:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
