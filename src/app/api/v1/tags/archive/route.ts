// src/app/api/v1/tags/archive/route.ts
import { NextRequest, NextResponse } from "next/server";
import { toggleTagArchived } from "~/server/actions/usersTags";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";

const archiveTagSchema = z.object({
  tagId: z.string().uuid(),
  isArchived: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tagId, isArchived } = archiveTagSchema.parse(body);

    const result = await toggleTagArchived({
      tagId,
      isArchived,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error archiving tag:", error);
    return NextResponse.json(
      { error: "Failed to archive tag" },
      { status: 500 },
    );
  }
}
