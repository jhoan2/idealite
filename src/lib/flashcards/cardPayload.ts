import { z } from "zod";

const qaPayloadSchema = z.object({
  prompt: z.string().min(1),
  response: z.string().min(1),
});

const clozePayloadSchema = z.object({
  sentence: z.string().min(1),
  blanks: z.array(z.string().min(1)).min(1),
});

const imagePayloadSchema = z.object({
  image_url: z.string().min(1),
  response: z.string().min(1),
  alt: z.string().nullable().optional(),
});

export type QACardPayload = z.infer<typeof qaPayloadSchema>;
export type ClozeCardPayload = z.infer<typeof clozePayloadSchema>;
export type ImageCardPayload = z.infer<typeof imagePayloadSchema>;

export type ParsedCardPayload =
  | { type: "qa"; payload: QACardPayload }
  | { type: "cloze"; payload: ClozeCardPayload }
  | { type: "image"; payload: ImageCardPayload };

export function buildQAPayload(prompt: string, response: string): QACardPayload {
  return {
    prompt: prompt.trim(),
    response: response.trim(),
  };
}

export function buildClozePayload(
  sentence: string,
  blanks: string[],
): ClozeCardPayload {
  return {
    sentence: sentence.trim(),
    blanks: blanks.map((blank) => blank.trim()).filter(Boolean),
  };
}

export function buildImagePayload(
  imageUrl: string,
  response: string,
  alt?: string | null,
): ImageCardPayload {
  return {
    image_url: imageUrl,
    response: response.trim(),
    alt: alt ?? null,
  };
}

export function parseCardPayload(card: {
  card_type: string | null;
  card_payload: unknown;
  image_cid?: string | null;
  description?: string | null;
}): ParsedCardPayload | null {
  if (card.card_type === "qa") {
    const parsed = qaPayloadSchema.safeParse(card.card_payload);
    return parsed.success ? { type: "qa", payload: parsed.data } : null;
  }

  if (card.card_type === "cloze") {
    const parsed = clozePayloadSchema.safeParse(card.card_payload);
    return parsed.success ? { type: "cloze", payload: parsed.data } : null;
  }

  if (card.card_type === "image") {
    const parsed = imagePayloadSchema.safeParse(card.card_payload);
    if (parsed.success) {
      return { type: "image", payload: parsed.data };
    }

    if (card.image_cid && card.description) {
      return {
        type: "image",
        payload: buildImagePayload(card.image_cid, card.description, null),
      };
    }
  }

  return null;
}

export function resolveCardImageSrc(imageUrl: string): string {
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  return `https://assets.idealite.xyz/${imageUrl}`;
}
