// /api/queue-flashcard
import { NextResponse } from "next/server";
import { z } from "zod";
import { queueFlashcardGeneration } from "~/lib/flashcards/flashcard-queue";
import { processNextFlashcardJob } from "~/lib/flashcards/flashcard-processor";
import { currentUser } from "@clerk/nextjs/server";

// Validate the request body
const requestSchema = z.object({
  content: z.string().min(1),
  pageId: z.string().uuid(),
  type: z.enum(["question-answer", "cloze"]),
  tagIds: z.array(z.string().uuid()).optional(),
  sourceLocator: z
    .object({
      type: z.enum(["page", "canvas"]),
      pointer: z.string().optional(),
    })
    .optional(),
});

export async function POST(req: Request) {
  try {
    // Get current user
    const user = await currentUser();
    if (!user?.externalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = requestSchema.parse(body);

    // Queue flashcard generation job
    const jobId = await queueFlashcardGeneration({
      userId: user.externalId,
      pageId: validatedData.pageId,
      content: validatedData.content,
      type: validatedData.type,
      tagIds: validatedData.tagIds,
      sourceLocator: validatedData.sourceLocator,
    });

    // Start processing the job asynchronously
    // We don't await this since we want to return immediately
    processNextFlashcardJob().catch(console.error);

    return NextResponse.json({
      success: true,
      message: "Flashcard generation queued successfully",
      jobId,
    });
  } catch (error) {
    console.error("Error queueing flashcard generation:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to queue flashcard generation" },
      { status: 500 },
    );
  }
}
