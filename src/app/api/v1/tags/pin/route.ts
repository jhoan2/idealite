// src/app/api/v1/tags/pin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { toggleTagPinned } from "~/server/actions/usersTags";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";

const pinTagSchema = z.object({
  tagId: z.string().uuid(),
  isPinned: z.boolean(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tagId, isPinned } = pinTagSchema.parse(body);

    const result = await toggleTagPinned({
      tagId,
      isPinned,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error toggling tag pin:", error);
    return NextResponse.json(
      { error: "Failed to toggle pin" },
      { status: 500 },
    );
  }
}
