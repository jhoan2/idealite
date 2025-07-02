// src/app/api/v1/cards/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { updateCard } from "~/server/actions/card";

const updateCardSchema = z.object({
  id: z.string().uuid(),
  content: z.string().optional(),
  description: z.string().optional(),
  question: z.string().optional(),
  answer: z.string().optional(),
  status: z.enum(["active", "mastered", "suspended"]).optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateCardSchema.parse(body);

    // Update the card using the existing server action
    const result = await updateCard(validatedData);

    return NextResponse.json({
      success: true,
      message: "Card updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error updating card:", error);
    return NextResponse.json(
      { error: "Failed to update card" },
      { status: 500 },
    );
  }
}
