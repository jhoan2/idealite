// src/app/api/v1/cards/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { deleteCard } from "~/server/actions/card";

const deleteCardSchema = z.object({
  id: z.string().uuid(),
});

export async function DELETE(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = deleteCardSchema.parse(body);

    // Delete the card using the existing server action
    const result = await deleteCard(id);

    return NextResponse.json({
      success: true,
      message: "Card deleted successfully",
      data: {
        id: result.id,
        page_id: result.page_id,
      },
    });
  } catch (error) {
    console.error("Error deleting card:", error);
    return NextResponse.json(
      { error: "Failed to delete card" },
      { status: 500 },
    );
  }
}
