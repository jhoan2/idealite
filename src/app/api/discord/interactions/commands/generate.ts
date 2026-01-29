import { Ratelimit } from "@upstash/ratelimit";
import { Client } from "@upstash/workflow";
import { eq } from "drizzle-orm";

import { env } from "~/env";
import {
  getUserId,
  createInteractionResponse,
  InteractionResponseType,
  type DiscordInteraction,
} from "~/lib/discord";
import { redis } from "~/lib/upstash/redis/redis";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";

// Rate limiter: 100 generations per day per user
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 d"),
  prefix: "discord-generate",
});

// Workflow client for notifying running workflows
const workflowClient = new Client({ token: env.QSTASH_TOKEN });

/**
 * Handle the /generate slash command
 */
export async function handleGenerateCommand(
  interaction: DiscordInteraction,
): Promise<Response> {
  const discordUserId = getUserId(interaction);

  // Check if user is registered
  const registeredUser = await db.query.users.findFirst({
    where: eq(users.discord_id, discordUserId),
  });

  if (!registeredUser) {
    return createInteractionResponse(
      InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      {
        content: "Please run `/register` first to create your account!",
        flags: 64,
      },
    );
  }

  // Check rate limit
  const { success, remaining } = await ratelimit.limit(discordUserId);
  if (!success) {
    return createInteractionResponse(
      InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      {
        content: `You've reached your daily limit of 100 generations. Try again tomorrow!`,
        flags: 64, // Ephemeral message
      },
    );
  }

  // Get the notes from the command options
  const notes =
    interaction.data?.options?.find((opt) => opt.name === "notes")?.value ?? "";

  if (!notes.trim()) {
    return createInteractionResponse(
      InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      {
        content: "Please provide some notes to generate an image from.",
        flags: 64,
      },
    );
  }

  // Send deferred response (we'll update it from the workflow)
  const deferredResponse = createInteractionResponse(
    InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
  );

  // Start the workflow in the background
  void startWorkflow(interaction, notes, remaining);

  return deferredResponse;
}

/**
 * Handle button/component interactions for generate command
 */
export async function handleGenerateComponent(
  interaction: DiscordInteraction,
): Promise<Response> {
  const customId = interaction.data?.custom_id ?? "";
  const userId = getUserId(interaction);

  // Parse custom_id to determine action type
  // Format: "fact:{workflowRunId}:{factId}"
  const [action, workflowRunId, selectionId] = customId.split(":");

  if (!workflowRunId) {
    return createInteractionResponse(
      InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      {
        content: "Invalid interaction",
        flags: 64,
      },
    );
  }

  // Send deferred update (shows loading state)
  const deferredResponse = createInteractionResponse(
    InteractionResponseType.DEFERRED_UPDATE_MESSAGE,
  );

  // Notify the workflow about the selection
  if (action === "fact") {
    void notifyWorkflow(workflowRunId, "fact-selected", {
      factId: selectionId,
      userId,
    });
  }

  return deferredResponse;
}

async function startWorkflow(
  interaction: DiscordInteraction,
  notes: string,
  remainingGenerations: number,
): Promise<void> {
  try {
    const workflowUrl = `${env.NEXT_PUBLIC_DEPLOYMENT_URL}/api/discord/workflow`;
    console.log("=== GENERATE: Starting workflow ===");
    console.log("=== GENERATE: Workflow URL ===", workflowUrl);
    console.log("=== GENERATE: Notes ===", notes.slice(0, 100));

    await workflowClient.trigger({
      url: workflowUrl,
      body: {
        discordUserId: getUserId(interaction),
        notes,
        channelId: interaction.channel_id,
        interactionToken: interaction.token,
        applicationId: interaction.application_id,
        remainingGenerations,
      },
    });
    console.log("=== GENERATE: Workflow triggered successfully ===");
  } catch (error) {
    console.error("=== GENERATE: Failed to start workflow ===", error);
  }
}

async function notifyWorkflow(
  workflowRunId: string,
  eventName: string,
  eventData: Record<string, string | undefined>,
): Promise<void> {
  try {
    await workflowClient.notify({
      eventId: `${eventName}-${workflowRunId}`,
      eventData,
    });
  } catch (error) {
    console.error("Failed to notify workflow:", error);
  }
}
