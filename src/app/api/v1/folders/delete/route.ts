// src/app/api/v1/folders/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { deleteFolder } from "~/server/actions/usersFolders";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";

const deleteFolderSchema = z.object({
  id: z.string().uuid(),
});

export async function DELETE(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = deleteFolderSchema.parse(body);

    const result = await deleteFolder({ id });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error deleting folder:", error);
    return NextResponse.json(
      { error: "Failed to delete folder" },
      { status: 500 },
    );
  }
}
