import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { env } from "~/env";
import { authorizeRoute } from "~/lib/api/authorize-route";

const genAI = new GoogleGenAI({ apiKey: env.GOOGLE_GEMINI_API_KEY });
const TEXT_MODEL_ID = "gemini-2.0-flash";

const requestSchema = z.object({
  notes: z.string().min(1, "Notes are required"),
  count: z.number().int().min(2).max(12).optional(),
});

const rawFlashcardSchema = z.object({
  id: z.number().int().optional(),
  question: z.string().min(1),
  answer: z.string().min(1),
  why_testable: z.string().min(1).optional(),
  confidence: z.number().optional(),
});

interface FlashcardRow {
  id: number;
  question: string;
  answer: string;
  why_testable: string;
  confidence: number;
}

export async function POST(req: Request) {
  try {
    if (!(await authorizeRoute(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const notes = parsed.data.notes.trim();
    const count = parsed.data.count ?? 8;

    const response = await genAI.models.generateContent({
      model: TEXT_MODEL_ID,
      contents: buildUserPrompt({ notes, count }),
      config: {
        systemInstruction: FLASHCARD_GENERATOR_SYSTEM_PROMPT,
        temperature: 0.5,
      },
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
    const jsonText = extractJsonArray(text);
    const rawRows = JSON.parse(jsonText) as unknown;

    if (!Array.isArray(rawRows) || rawRows.length === 0) {
      return NextResponse.json(
        { error: "No flashcards returned by model" },
        { status: 500 },
      );
    }

    const cards: FlashcardRow[] = [];
    const seen = new Set<string>();

    for (const [index, row] of rawRows.entries()) {
      const parsedRow = rawFlashcardSchema.safeParse(row);
      if (!parsedRow.success) continue;

      const question = normalizeText(parsedRow.data.question);
      const answer = normalizeText(parsedRow.data.answer);
      const key = `${question.toLowerCase()}|||${answer.toLowerCase()}`;
      if (!question || !answer || seen.has(key)) continue;
      seen.add(key);

      cards.push({
        id: index + 1,
        question,
        answer,
        why_testable:
          normalizeText(parsedRow.data.why_testable ?? "") ||
          "Likely exam retrieval target.",
        confidence: clampConfidence(parsedRow.data.confidence),
      });
    }

    if (cards.length === 0) {
      return NextResponse.json(
        { error: "Failed to parse valid flashcards from model output" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        flashcards: cards.slice(0, count),
      },
    });
  } catch (error) {
    console.error("Error generating flashcards from notes:", error);
    return NextResponse.json(
      { error: "Failed to generate flashcards from notes" },
      { status: 500 },
    );
  }
}

const FLASHCARD_GENERATOR_SYSTEM_PROMPT = `You are an exam-focused flashcard writer.

Goal:
- Convert notes into concise question-answer flashcards that are likely test targets.

Rules:
1) Each card must have one clear question and one precise answer.
2) Prefer high-yield and confusable facts over generic summaries.
3) Include factoids when useful (numbers, cutoffs, named associations).
4) Question should be answerable from one key concept, not multi-part essay prompts.
5) Keep question and answer concise.
6) Return JSON array only. No markdown.`;

function buildUserPrompt(input: { notes: string; count: number }) {
  return `Create ${input.count} exam-style question-answer flashcards from these notes.

Notes:
${input.notes.slice(0, 12000)}

Return JSON array with objects:
{
  "id": number,
  "question": "string",
  "answer": "string",
  "why_testable": "string",
  "confidence": 0.0
}`;
}

function extractJsonArray(text: string): string {
  const firstBracket = text.indexOf("[");
  const lastBracket = text.lastIndexOf("]");
  if (firstBracket === -1 || lastBracket === -1 || lastBracket <= firstBracket) {
    throw new Error("No JSON array found in model response");
  }
  return text.slice(firstBracket, lastBracket + 1);
}

function normalizeText(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function clampConfidence(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0.7;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
