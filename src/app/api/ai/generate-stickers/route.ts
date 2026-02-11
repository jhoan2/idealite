import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { env } from "~/env";
import { authorizeRoute } from "~/lib/api/authorize-route";
import { selectStickerPrompt } from "~/lib/ai/sticker-prompt-selector";
import type { StickerAssociation } from "~/lib/ai/types";

const genAI = new GoogleGenAI({ apiKey: env.GOOGLE_GEMINI_API_KEY });
const TEXT_MODEL_ID = "gemini-2.0-flash";

const pairSchema = z.object({
  pair_id: z.number(),
  fact: z.string(),
  component_a: z.string(),
  component_b: z.string(),
});

const requestSchema = z.object({
  pairs: z.array(pairSchema).min(1, "At least one pair is required"),
  countPerPair: z.number().int().min(1).max(6).optional(),
});

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

    const { pairs } = parsed.data;
    const countPerPair = parsed.data.countPerPair ?? 1;
    const selectedPrompt = selectStickerPrompt({
      experimentEnabled: env.STICKER_PROMPT_EXPERIMENT_ENABLED,
      version: env.STICKER_PROMPT_VERSION,
    });

    const pairsJson = JSON.stringify(pairs, null, 2);

    const userMessage = `Here are the fact pairs to symbolize:
${pairsJson}

Create ${countPerPair} distinct sticker association option(s) for EACH pair.

Rules:
1) Always symbolize BOTH components (A and B).
2) Vary symbol selection and interaction across options.
3) Keep each option atomic, visual, and drawable.
4) Return ONLY a JSON array.
5) Keep pair_id mapped to the source pair.

If countPerPair is greater than 1, return multiple rows with the same pair_id for each source pair.`;

    const response = await genAI.models.generateContent({
      model: TEXT_MODEL_ID,
      contents: userMessage,
      config: {
        systemInstruction: selectedPrompt.prompt,
        temperature: 1.0,
      },
    });

    const responseText =
      response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    const jsonMatch = /\[[\s\S]*\]/.exec(responseText);
    if (!jsonMatch) {
      console.error("Failed to extract JSON from response:", responseText);
      return NextResponse.json(
        { error: "Failed to generate sticker associations. Please try again." },
        { status: 500 },
      );
    }

    let stickers: StickerAssociation[];
    try {
      stickers = JSON.parse(jsonMatch[0]) as StickerAssociation[];
    } catch {
      console.error("Failed to parse stickers JSON:", jsonMatch[0]);
      return NextResponse.json(
        { error: "Failed to parse sticker data. Please try again." },
        { status: 500 },
      );
    }

    if (!Array.isArray(stickers) || stickers.length === 0) {
      return NextResponse.json(
        { error: "No stickers were generated. Please try again." },
        { status: 500 },
      );
    }

    const normalized =
      pairs.length === 1
        ? stickers.map((sticker) => ({
            ...sticker,
            pair_id: pairs[0].pair_id,
          }))
        : stickers.filter((sticker) =>
            pairs.some((pair) => pair.pair_id === sticker.pair_id),
          );
    if (normalized.length === 0) {
      return NextResponse.json(
        { error: "No stickers matched input pairs. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        stickers: normalized,
        prompt_version: selectedPrompt.version,
      },
    });
  } catch (error) {
    console.error("Error generating stickers:", error);
    return NextResponse.json(
      { error: "Failed to generate stickers" },
      { status: 500 },
    );
  }
}
