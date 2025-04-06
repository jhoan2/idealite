"use server";

import { completeTurn } from "~/server/services/spinwheel/turn";

/**
 * Server action to complete a spin wheel turn with the points earned
 * @param gameId The ID of the game session
 * @param points The points earned in this turn
 */
export async function completeSpinWheelTurn(gameId: string, points: number) {
  try {
    const result = await completeTurn(gameId, points);

    return { ...result };
  } catch (error) {
    console.error("Failed to complete spin wheel turn:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
