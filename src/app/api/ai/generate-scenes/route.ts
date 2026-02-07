import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { env } from "~/env";
import type { SceneCard } from "~/lib/ai/types";

const genAI = new GoogleGenAI({ apiKey: env.GOOGLE_GEMINI_API_KEY });
const TEXT_MODEL_ID = "gemini-2.0-flash";

const requestSchema = z.object({
  notes: z.string().min(1, "Notes are required"),
  highlights: z.array(z.string()).optional(),
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
        { status: 400 }
      );
    }

    const { notes, highlights } = parsed.data;

    const anchorsSection =
      highlights && highlights.length > 0
        ? `Visual Anchors (user-highlighted passages to memorize):\n${highlights.map((h, i) => `${i + 1}. "${h}"`).join("\n")}`
        : "No specific highlights provided. Extract the 3-5 highest-yield facts from the notes automatically.";

    const userMessage = `${anchorsSection}

User's notes:
${notes.slice(0, 6000)}

Generate 4 distinct mnemonic scene cards for these facts. Return ONLY a JSON array.`;

    const response = await genAI.models.generateContent({
      model: TEXT_MODEL_ID,
      contents: userMessage,
      config: {
        systemInstruction: env.MNEMONIC_SYSTEM_PROMPT,
        temperature: 1.0,
      },
    });

    const responseText =
      response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    const jsonMatch = /\[[\s\S]*\]/.exec(responseText);
    if (!jsonMatch) {
      console.error("Failed to extract JSON from response:", responseText);
      return NextResponse.json(
        { error: "Failed to generate scene cards. Please try again." },
        { status: 500 }
      );
    }

    let scenes: SceneCard[];
    try {
      scenes = JSON.parse(jsonMatch[0]) as SceneCard[];
    } catch {
      console.error("Failed to parse scenes JSON:", jsonMatch[0]);
      return NextResponse.json(
        { error: "Failed to parse scene data. Please try again." },
        { status: 500 }
      );
    }

    if (!Array.isArray(scenes) || scenes.length === 0) {
      return NextResponse.json(
        { error: "No scenes were generated. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: { scenes } });
  } catch (error) {
    console.error("Error generating scenes:", error);
    return NextResponse.json(
      { error: "Failed to generate scenes" },
      { status: 500 }
    );
  }
}
