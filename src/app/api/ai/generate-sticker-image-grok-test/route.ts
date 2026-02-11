import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";

import { env } from "~/env";

const GROK_CHAT_COMPLETIONS_URL = "https://api.x.ai/v1/chat/completions";
const GROK_IMAGE_GENERATIONS_URL = "https://api.x.ai/v1/images/generations";
const GROK_MODEL = "grok-4-latest";
const GROK_IMAGE_MODEL = "grok-imagine-image";

const stickerSchema = z.object({
  pair_id: z.number(),
  component_a: z.object({
    label: z.string().min(1),
    symbol: z.string().min(1),
  }),
  component_b: z.object({
    label: z.string().min(1),
    symbol: z.string().min(1),
  }),
  interaction: z.string().min(1),
});

const requestSchema = z.object({
  sticker: stickerSchema,
});

interface GrokChatResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ text?: string }>;
    };
  }>;
  error?: { message?: string };
}

interface GrokImageResponse {
  images?: Array<{
    url?: string;
    b64_json?: string;
  }>;
  data?: Array<{
    url?: string;
    b64_json?: string;
  }>;
  error?: { message?: string };
}

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

    const { sticker } = parsed.data;
    const grokApiKey = env.GROK_API_KEY;
    if (!grokApiKey) {
      return NextResponse.json(
        { error: "GROK_API_KEY is not configured" },
        { status: 500 },
      );
    }

    const grokFusionPrompt = await generateGrokFusionPrompt(sticker, grokApiKey);
    let fusionUrl: string;

    try {
      fusionUrl = await generateGrokImage({
        prompt: `${grokFusionPrompt} Preserve both subjects and make the interaction explicit.`,
        apiKey: grokApiKey,
      });
    } catch {
      fusionUrl = await generateGrokImage({
        prompt: `${grokFusionPrompt} Include both subjects: ${sticker.component_a.symbol} and ${sticker.component_b.symbol}.`,
        apiKey: grokApiKey,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        pair_id: sticker.pair_id,
        fusion_prompt: grokFusionPrompt,
        fusion_url: fusionUrl,
        fusion_model: GROK_IMAGE_MODEL,
      },
    });
  } catch (error) {
    console.error("Error generating Grok sticker image test:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate Grok sticker image test",
      },
      { status: 500 },
    );
  }
}

async function generateGrokFusionPrompt(
  sticker: z.infer<typeof stickerSchema>,
  apiKey: string,
): Promise<string> {
  const response = await fetch(GROK_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROK_MODEL,
      stream: false,
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You write concise visual prompts for generating mnemonic sticker images.",
        },
        {
          role: "user",
          content: `Create one final image prompt for a sticker where two subjects physically interact.

Subject A label: ${sticker.component_a.label}
Subject A symbol: ${sticker.component_a.symbol}
Subject B label: ${sticker.component_b.label}
Subject B symbol: ${sticker.component_b.symbol}
Interaction to preserve: ${sticker.interaction}

Return only one prompt sentence and nothing else.
Style constraints: die-cut sticker, white background, thick black outlines, vibrant colors, cel-shaded, no text, no letters.`,
        },
      ],
    }),
  });

  const raw = (await response.json()) as GrokChatResponse;
  if (!response.ok) {
    throw new Error(
      raw.error?.message ??
        `Grok chat completion failed with status ${response.status}`,
    );
  }

  const content = raw.choices?.[0]?.message?.content;
  const text =
    typeof content === "string"
      ? content.trim()
      : (content ?? [])
          .map((part) => part.text?.trim() ?? "")
          .filter(Boolean)
          .join(" ")
          .trim();

  if (!text) {
    throw new Error("Grok returned empty fusion prompt");
  }

  return text;
}

async function generateGrokImage(input: {
  prompt: string;
  apiKey: string;
}): Promise<string> {
  const generationResponse = await fetch(GROK_IMAGE_GENERATIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROK_IMAGE_MODEL,
      prompt: input.prompt,
      n: 1,
      response_format: "url",
    }),
  });

  const generationRaw = (await generationResponse.json()) as GrokImageResponse;
  if (!generationResponse.ok) {
    throw new Error(
      generationRaw.error?.message ??
        `status ${generationResponse.status} from image generation`,
    );
  }

  const url = extractFirstGrokImageUrl(generationRaw);
  if (!url) {
    throw new Error("Grok image generation returned no URL output");
  }

  return url;
}

function extractFirstGrokImageUrl(raw: GrokImageResponse): string | null {
  const candidates = raw.data?.length ? raw.data : raw.images;
  if (!candidates?.length) return null;

  const first = candidates[0];
  if (first?.url) return first.url;
  if (first?.b64_json) return `data:image/png;base64,${first.b64_json}`;
  return null;
}
