import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { env } from "~/env";
import type { StickerAssociation, SymbolTechnique } from "~/lib/ai/types";
import { selectStickerPrompt } from "~/lib/ai/sticker-prompt-selector";

const genAI = new GoogleGenAI({ apiKey: env.GOOGLE_GEMINI_API_KEY });
const TEXT_MODEL_ID = "gemini-2.0-flash";

const requestSchema = z.object({
  wordA: z.string().min(1, "Word A is required"),
  wordB: z.string().min(1, "Word B is required"),
  count: z.number().int().min(2).max(6).optional(),
});

const rawChoiceSchema = z.object({
  pair_id: z.number().optional(),
  component_a: z.object({
    label: z.string().optional(),
    symbol: z.string().min(1),
    technique: z.string().min(1),
  }),
  component_b: z.object({
    label: z.string().optional(),
    symbol: z.string().min(1),
    technique: z.string().min(1),
  }),
  interaction: z.string().min(1),
  reasoning: z.string().min(1),
  image_prompt: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
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

    const wordA = parsed.data.wordA.trim();
    const wordB = parsed.data.wordB.trim();
    const count = parsed.data.count ?? 4;
    const literalWordB = normalizeLiteralObject(wordB);
    const selectedPrompt = selectStickerPrompt({
      experimentEnabled: env.STICKER_PROMPT_EXPERIMENT_ENABLED,
      version: env.STICKER_PROMPT_VERSION,
    });
    const pairJson = JSON.stringify(
      [
        {
          pair_id: 1,
          fact: `${wordA} :: ${wordB}`,
          component_a: wordA,
          component_b: wordB,
        },
      ],
      null,
      2,
    );

    const response = await genAI.models.generateContent({
      model: TEXT_MODEL_ID,
      contents: buildUserPrompt({ wordA, wordB, count, pairJson }),
      config: {
        systemInstruction: selectedPrompt.prompt,
        temperature: 0.9,
      },
    });

    const responseText =
      response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

    const jsonText = extractJsonArray(responseText);
    const rawChoices = JSON.parse(jsonText) as unknown;

    if (!Array.isArray(rawChoices) || rawChoices.length === 0) {
      return NextResponse.json(
        { error: "No choices returned by model" },
        { status: 500 },
      );
    }

    const choices: StickerAssociation[] = [];

    for (const [index, item] of rawChoices.entries()) {
      const row = rawChoiceSchema.safeParse(item);
      if (!row.success) continue;

      choices.push({
        pair_id: index + 1,
        component_a: {
          label: wordA,
          symbol: row.data.component_a.symbol,
          technique: normalizeTechnique(row.data.component_a.technique),
        },
        component_b: {
          label: wordB,
          symbol: literalWordB,
          technique: "semantic",
        },
        interaction: row.data.interaction,
        reasoning: row.data.reasoning,
        image_prompt: row.data.image_prompt,
      });
    }

    if (choices.length === 0) {
      return NextResponse.json(
        { error: "Failed to parse generated choices" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        choices,
        prompt_version: selectedPrompt.version,
      },
    });
  } catch (error) {
    console.error("Error generating two-word choices:", error);
    return NextResponse.json(
      { error: "Failed to generate two-word choices" },
      { status: 500 },
    );
  }
}

function buildUserPrompt(input: {
  wordA: string;
  wordB: string;
  count: number;
  pairJson: string;
}) {
  return `Generate ${input.count} distinct mnemonic sticker choices for this pair:

Word A (foreign/source term): ${input.wordA}
Word B (native meaning object): ${input.wordB}
Pair payload:
${input.pairJson}

Rules:
1) Generate ${input.count} ALTERNATIVES for the SAME pair, varying symbolization + interaction style.
2) component_a should be mnemonic/associated and can vary.
3) Keep Word B literal as the target object (do not transform Word B into phonetic symbol).
4) component_b.symbol must stay exactly "${input.wordB}" (or article + ${input.wordB}).
5) component_b.technique must be "semantic".
6) Interaction must be one physical action (smashes, squeezes, melts, pierces, etc.).
7) Keep image prompts in sticker style with white background, thick outlines, vibrant colors, no text.
8) Return ONLY a JSON array. No markdown.

Required JSON item format:
{
  "pair_id": number,
  "component_a": { "label": "${input.wordA}", "symbol": "string", "technique": "phonetic|semantic|pao|cultural|spatial" },
  "component_b": { "label": "${input.wordB}", "symbol": "${input.wordB}", "technique": "semantic" },
  "interaction": "string",
  "reasoning": "string",
  "image_prompt": "string"
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

function normalizeTechnique(input: string): SymbolTechnique {
  const normalized = input.toLowerCase().trim();
  if (normalized.includes("phonetic")) return "phonetic";
  if (normalized.includes("semantic")) return "semantic";
  if (normalized.includes("cultural")) return "cultural";
  if (normalized.includes("spatial") || normalized.includes("numeric"))
    return "spatial";
  if (normalized.includes("pao")) return "pao";
  return "semantic";
}

function normalizeLiteralObject(word: string): string {
  return word.replace(/\s+/g, " ").trim();
}
