// app/api/v1/folders/rename/route.ts
import { NextRequest, NextResponse } from "next/server";
import { renameFolder } from "~/server/actions/folder";
import { z } from "zod";

const renameFolderSchema = z.object({
  folderId: z.string().uuid(),
  newName: z.string().min(1).max(255),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = renameFolderSchema.parse(body);

    const result = await renameFolder(validatedData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to rename folder" },
        { status: 400 },
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("API Error renaming folder:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
