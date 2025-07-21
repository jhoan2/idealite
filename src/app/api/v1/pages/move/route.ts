// src/app/api/v1/pages/move/route.ts
import { NextRequest, NextResponse } from "next/server";
import { movePage } from "~/server/actions/page";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";

const movePageSchema = z.object({
  pageId: z.string().uuid(),
  destinationId: z.string(), // Can be "folder-uuid" or "tag-uuid"
});

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { pageId, destinationId } = movePageSchema.parse(body);

    const result = await movePage({
      pageId,
      destinationId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error moving page:", error);
    return NextResponse.json({ error: "Failed to move page" }, { status: 500 });
  }
}
