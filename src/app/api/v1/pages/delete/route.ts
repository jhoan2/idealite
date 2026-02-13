// src/app/api/v1/pages/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { deletePage } from "~/server/actions/page";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";

const deletePageSchema = z.object({
  id: z.string().uuid(),
});

export async function DELETE(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = deletePageSchema.parse(body);
    const result = await deletePage({ id });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error deleting page:", error);
    return NextResponse.json(
      { error: "Failed to delete page" },
      { status: 500 },
    );
  }
}
