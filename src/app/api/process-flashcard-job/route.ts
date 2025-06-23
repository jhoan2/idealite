// /api/process-flashcard-job
import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import {
  getFlashcardRedisClient,
  QueuedFlashcardJob,
  JOB_RESULT_TTL,
} from "~/lib/flashcards/flashcard-queue";
import { createCardFromPage } from "~/server/actions/card";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";

// Initialize Gemini AI client
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY! });

const jobSchema = z.object({
  id: z.string(),
  data: z.object({
    userId: z.string(),
    pageId: z.string().uuid(),
    content: z.string(),
    type: z.enum(["question-answer", "cloze"]),
    tagIds: z.array(z.string().uuid()).optional(),
    sourceLocator: z
      .object({
        type: z.enum(["page", "canvas"]),
        pointer: z.string().optional(),
      })
      .optional(),
  }),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  createdAt: z.string(),
});

// Function to construct prompt for question-answer flashcards
function constructQAPrompt(content: string) {
  return `You will be given a paragraph of text. Your task is to create a flashcard in the form of a question and answer based on this paragraph. Here's the text:

<paragraph>
${content}
</paragraph>

Follow these steps to create the flashcard:

1. Identify the main idea or an important detail from the paragraph.
2. Create one question and one answer that captures this main idea or detail.
3. Ensure that the question and answer are based solely on the information provided in the paragraph.

Output your flashcard in the following format (and ONLY this format):

<flashcard>
<question>[Question based on the paragraph]</question>
<answer>[Answer based on the paragraph]</answer>
</flashcard>

The question should be concise but clear, and the answer should be comprehensive enough to fully answer the question without being excessively verbose.`;
}

// Function to construct prompt for cloze flashcards
function constructClozePrompt(content: string) {
  return `You will be given a paragraph of text. Your task is to create a fill-in-the-blank flashcard based on this paragraph. Here's the text:

<paragraph>
${content}
</paragraph>

Follow these steps to create the flashcard:

1. Choose a sentence from the paragraph that contains a meaningful and relevant term or concept.
2. Create a fill-in-the-blank version of the sentence by replacing a key word or phrase with exactly five underscores (_____).
3. The removed word should be significant to the meaning of the sentence, not a filler word like "is," "or," or "that."

Output your flashcard in the following format (and ONLY this format):

<flashcard>
<cloze_template>[Insert the fill-in-the-blank sentence here with _____ for the blank]</cloze_template>
<cloze_answers>[Insert the word or short phrase that was removed]</cloze_answers>
</flashcard>

Examples:
- Good cloze: The universe was created about 13.6 _____ years ago. (with "billion" as the answer)
- Bad cloze: The universe _____ created about 13.6 billion years ago. (with "was" as the answer)`;
}

// Parse QA response
function parseQAResponse(text: string) {
  const questionMatch = text.match(/<question>(.*?)<\/question>/s);
  const answerMatch = text.match(/<answer>(.*?)<\/answer>/s);

  if (questionMatch?.[1] && answerMatch?.[1]) {
    return {
      question: questionMatch[1].trim(),
      answer: answerMatch[1].trim(),
    };
  }
  return null;
}

// Parse Cloze response
function parseClozeResponse(text: string) {
  const templateMatch = text.match(/<cloze_template>(.*?)<\/cloze_template>/s);
  const answersMatch = text.match(/<cloze_answers>(.*?)<\/cloze_answers>/s);

  if (templateMatch?.[1] && answersMatch?.[1]) {
    return {
      cloze_template: templateMatch[1].trim(),
      cloze_answers: answersMatch[1].trim(),
    };
  }
  return null;
}

async function processFlashcardJob(job: QueuedFlashcardJob) {
  const { userId, pageId, content, type, tagIds, sourceLocator } = job.data;

  // Construct prompt based on flashcard type
  const prompt =
    type === "question-answer"
      ? constructQAPrompt(content)
      : constructClozePrompt(content);

  // Generate content using Gemini
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });

  const textContent = response.text ?? "";

  // Parse response based on flashcard type
  let cardData;
  const twoWeeksFromNow = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  if (type === "question-answer") {
    const qaResult = parseQAResponse(textContent);
    if (!qaResult) {
      throw new Error("Failed to parse question-answer response");
    }

    cardData = {
      pageId,
      content,
      question: qaResult.question,
      answer: qaResult.answer,
      tagIds,
      cardType: "qa" as const,
      nextReview: twoWeeksFromNow.toISOString(),
      sourceLocator,
    };
  } else {
    const clozeResult = parseClozeResponse(textContent);
    if (!clozeResult) {
      throw new Error("Failed to parse cloze response");
    }

    cardData = {
      pageId,
      content,
      clozeTemplate: clozeResult.cloze_template,
      clozeAnswers: clozeResult.cloze_answers,
      tagIds,
      cardType: "cloze" as const,
      nextReview: twoWeeksFromNow.toISOString(),
      sourceLocator,
    };
  }

  // Create the flashcard
  const result = await createCardFromPage(cardData, userId);

  if (!result.success) {
    throw new Error(result.error || "Failed to create flashcard");
  }

  return result.data;
}

// Handler wrapped with QStash signature verification
async function handler(req: Request) {
  try {
    const body = await req.json();
    const job = jobSchema.parse(body);

    // Process the job
    const result = await processFlashcardJob(job);

    // Update job status
    const redis = getFlashcardRedisClient();
    const jobKey = `flashcard-job:${job.id}`;

    await redis
      .pipeline()
      .hset(jobKey, {
        status: "completed",
        processedAt: new Date().toISOString(),
        result: JSON.stringify(result),
      })
      .expire(jobKey, JOB_RESULT_TTL)
      .exec();

    return NextResponse.json({
      success: true,
      message: "Flashcard created successfully",
      result,
    });
  } catch (error) {
    console.error("Error processing flashcard job:", error);

    // If we have a job ID, update the job status
    try {
      const body = await req.json();
      if (body?.id) {
        const redis = getFlashcardRedisClient();
        const jobKey = `flashcard-job:${body.id}`;

        await redis
          .pipeline()
          .hset(jobKey, {
            status: "failed",
            error: error instanceof Error ? error.message : String(error),
            processedAt: new Date().toISOString(),
          })
          .expire(jobKey, JOB_RESULT_TTL) // Add TTL to the hash (7 days)
          .exec();
      }
    } catch (e) {
      // Ignore
    }
    return NextResponse.json(
      {
        error: "Failed to process flashcard job",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export const POST = verifySignatureAppRouter(handler);
