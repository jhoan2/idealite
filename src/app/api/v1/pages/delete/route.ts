// src/app/api/v1/pages/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { deletePage } from "~/server/actions/page";
import { deleteTabMatchingPageTitle } from "~/server/actions/tabs";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";

const deletePageSchema = z.object({
  id: z.string().uuid(),
  title: z.string().optional(), // For deleting associated tabs
});

export async function DELETE(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, title } = deletePageSchema.parse(body);

    // Delete the page
    const result = await deletePage({ id });

    // Delete associated tabs if title is provided
    if (title && result.success) {
      await deleteTabMatchingPageTitle(title);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error deleting page:", error);
    return NextResponse.json(
      { error: "Failed to delete page" },
      { status: 500 },
    );
  }
}
