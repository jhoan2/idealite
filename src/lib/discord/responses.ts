import { DISCORD_API_BASE } from "./constants";
import { type DiscordMessagePayload } from "./types";

/**
 * Create an immediate response for Discord interactions
 */
export function createInteractionResponse(
  type: number,
  data?: DiscordMessagePayload,
): Response {
  return new Response(
    JSON.stringify({
      type,
      data,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}

/**
 * Send a follow-up message to Discord
 */
export async function sendDiscordFollowUp(
  applicationId: string,
  interactionToken: string,
  payload: DiscordMessagePayload,
): Promise<Response> {
  const url = `${DISCORD_API_BASE}/webhooks/${applicationId}/${interactionToken}`;

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

/**
 * Update the original interaction response
 */
export async function updateDiscordMessage(
  applicationId: string,
  interactionToken: string,
  payload: DiscordMessagePayload,
): Promise<Response> {
  const url = `${DISCORD_API_BASE}/webhooks/${applicationId}/${interactionToken}/messages/@original`;

  return fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}
