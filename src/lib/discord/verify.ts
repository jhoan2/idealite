import { verifyKey } from "discord-interactions";

import { env } from "~/env";
import { type DiscordInteraction } from "./types";

/**
 * Verify Discord request signature
 */
export async function verifyDiscordRequest(
  request: Request,
): Promise<{ isValid: boolean; interaction: DiscordInteraction | null }> {
  const signature = request.headers.get("X-Signature-Ed25519");
  const timestamp = request.headers.get("X-Signature-Timestamp");

  if (!signature || !timestamp) {
    console.log("=== VERIFY: Missing headers ===");
    return { isValid: false, interaction: null };
  }

  const body = await request.text();

  // Handle empty body (from health checks or invalid requests)
  if (!body) {
    return { isValid: false, interaction: null };
  }

  const isValidRequest = await verifyKey(
    body,
    signature,
    timestamp,
    env.DISCORD_PUBLIC_KEY,
  );

  if (!isValidRequest) {
    return { isValid: false, interaction: null };
  }

  const interaction = JSON.parse(body) as DiscordInteraction;
  return { isValid: true, interaction };
}
