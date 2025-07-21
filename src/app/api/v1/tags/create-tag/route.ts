// src/app/api/v1/tags/create-tag/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createTagForUser } from "~/server/actions/usersTags";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";

const createTagSchema = z.object({
  name: z.string().min(1),
  parentId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, parentId } = createTagSchema.parse(body);

    const result = await createTagForUser({
      name,
      parentId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating tag:", error);
    return NextResponse.json(
      { error: "Failed to create tag" },
      { status: 500 },
    );
  }
}
