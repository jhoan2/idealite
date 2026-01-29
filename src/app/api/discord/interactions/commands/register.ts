import { eq } from "drizzle-orm";

import {
  getUserId,
  getDiscordUser,
  getDiscordAvatarUrl,
  createInteractionResponse,
  InteractionResponseType,
  type DiscordInteraction,
} from "~/lib/discord";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";

// Valid email domains (Gmail and Apple only)
const VALID_EMAIL_DOMAINS = ["@gmail.com", "@icloud.com"];

/**
 * Handle the /register slash command
 */
export async function handleRegisterCommand(
  interaction: DiscordInteraction,
): Promise<Response> {
  const discordUserId = getUserId(interaction);

  // Check if user already has an account
  const existingUser = await db.query.users.findFirst({
    where: eq(users.discord_id, discordUserId),
  });

  if (existingUser) {
    return createInteractionResponse(
      InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      {
        content: "You're already registered! You can use all features.",
        flags: 64, // Ephemeral
      },
    );
  }

  // Show modal to collect email
  return new Response(
    JSON.stringify({
      type: InteractionResponseType.MODAL,
      data: {
        custom_id: "register_modal",
        title: "Create Your Account",
        components: [
          {
            type: 1, // Action Row
            components: [
              {
                type: 4, // Text Input
                custom_id: "email_input",
                label: "Email Address (Gmail or Apple)",
                style: 1, // Short
                placeholder: "your@gmail.com or your@icloud.com",
                required: true,
                min_length: 5,
                max_length: 256,
              },
            ],
          },
        ],
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

/**
 * Handle the registration modal submission
 */
export async function handleRegisterModal(
  interaction: DiscordInteraction,
): Promise<Response> {
  // Extract email from modal components
  const emailInput = interaction.data?.components?.[0]?.components?.[0];
  const email = emailInput?.value?.toLowerCase().trim() ?? "";

  const discordUser = getDiscordUser(interaction);
  if (!discordUser) {
    return createInteractionResponse(
      InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      {
        content: "Could not identify your Discord account. Please try again.",
        flags: 64,
      },
    );
  }

  // Validate email provider (Gmail or Apple only)
  const isValidProvider = VALID_EMAIL_DOMAINS.some((domain) =>
    email.endsWith(domain),
  );

  if (!isValidProvider) {
    return createInteractionResponse(
      InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      {
        content:
          "Please use a Gmail or Apple email address (e.g., @gmail.com, @icloud.com, @me.com).",
        flags: 64,
      },
    );
  }

  // Check if Discord user already registered (race condition protection)
  const existingDiscordUser = await db.query.users.findFirst({
    where: eq(users.discord_id, discordUser.id),
  });

  if (existingDiscordUser) {
    return createInteractionResponse(
      InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      {
        content: "You're already registered!",
        flags: 64,
      },
    );
  }

  // Check if email already used
  const existingEmailUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingEmailUser) {
    return createInteractionResponse(
      InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      {
        content:
          "This email is already registered. If this is your account, you can log in on the website to link your Discord.",
        flags: 64,
      },
    );
  }

  // Create user in database
  try {
    await db.insert(users).values({
      discord_id: discordUser.id,
      email: email,
      display_name: discordUser.global_name ?? discordUser.username,
      pfp_url: getDiscordAvatarUrl(discordUser),
      role: "user",
      is_onboarded: true,
    });

    return createInteractionResponse(
      InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      {
        content:
          "Account created! You can now use all features. Welcome to Idealite!",
        flags: 64,
      },
    );
  } catch (error) {
    console.error("Failed to create user:", error);
    return createInteractionResponse(
      InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      {
        content:
          "Something went wrong while creating your account. Please try again.",
        flags: 64,
      },
    );
  }
}
