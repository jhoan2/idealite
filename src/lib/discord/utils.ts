import { type DiscordInteraction, type DiscordUser } from "./types";

/**
 * Get user ID from interaction (works for both DM and guild contexts)
 */
export function getUserId(interaction: DiscordInteraction): string {
  return interaction.member?.user.id ?? interaction.user?.id ?? "";
}

/**
 * Get full Discord user object from interaction
 */
export function getDiscordUser(interaction: DiscordInteraction): DiscordUser | null {
  return interaction.member?.user ?? interaction.user ?? null;
}

/**
 * Get Discord avatar URL for a user
 */
export function getDiscordAvatarUrl(user: DiscordUser): string | null {
  if (!user.avatar) return null;
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
}
