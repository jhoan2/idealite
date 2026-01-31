import {
  verifyDiscordRequest,
  createInteractionResponse,
  InteractionType,
  InteractionResponseType,
} from "~/lib/discord";
import { handleRegisterCommand, handleRegisterModal } from "./commands/register";
import { handleGenerateCommand, handleGenerateComponent } from "./commands/generate";

export async function POST(request: Request) {
  console.log("=== INTERACTIONS: Received request ===");

  // Verify the request is from Discord
  const { isValid, interaction } = await verifyDiscordRequest(request);
  console.log("=== INTERACTIONS: Verification ===", {
    isValid,
    type: interaction?.type,
  });

  if (!isValid || !interaction) {
    console.log("=== INTERACTIONS: Invalid request ===");
    return new Response("Invalid request signature", { status: 401 });
  }

  // Handle PING (Discord verification)
  if (interaction.type === InteractionType.PING) {
    console.log("=== INTERACTIONS: PING ===");
    return createInteractionResponse(InteractionResponseType.PONG);
  }

  // Handle slash commands
  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    const commandName = interaction.data?.name;
    console.log("=== INTERACTIONS: Slash command ===", commandName);

    if (commandName === "register") {
      return handleRegisterCommand(interaction);
    }

    if (commandName === "generate") {
      return handleGenerateCommand(interaction);
    }

    return createInteractionResponse(
      InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      {
        content: "Unknown command",
        flags: 64,
      },
    );
  }

  // Handle button clicks and dropdown selections
  if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
    const customId = interaction.data?.custom_id ?? "";
    console.log("=== INTERACTIONS: Component ===", customId);

    // Route to appropriate handler based on custom_id prefix
    if (customId.startsWith("fact:")) {
      return handleGenerateComponent(interaction);
    }

    return createInteractionResponse(
      InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      {
        content: "Unknown component interaction",
        flags: 64,
      },
    );
  }

  // Handle modal submissions
  if (interaction.type === InteractionType.MODAL_SUBMIT) {
    const customId = interaction.data?.custom_id;
    console.log("=== INTERACTIONS: Modal submit ===", customId);

    if (customId === "register_modal") {
      return handleRegisterModal(interaction);
    }

    return createInteractionResponse(
      InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      {
        content: "Unknown modal submission",
        flags: 64,
      },
    );
  }

  return new Response("Unknown interaction type", { status: 400 });
}
