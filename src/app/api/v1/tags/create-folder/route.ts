// src/app/api/v1/tags/create-folder/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createFolder } from "~/server/actions/usersFolders";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";

const createFolderSchema = z.object({
  name: z.string().optional(),
  tagId: z.string().uuid(),
  parentFolderId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, tagId, parentFolderId } = createFolderSchema.parse(body);

    const result = await createFolder({
      name,
      tagId,
      parentFolderId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating folder:", error);
    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 },
    );
  }
}
