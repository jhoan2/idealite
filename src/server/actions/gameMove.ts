"use server";

import { db } from "~/server/db";
import { game_move, game_session } from "~/server/db/schema";
import { auth } from "~/app/auth";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { eq } from "drizzle-orm";

const createGameMoveSchema = z.object({
  sessionId: z.string().uuid(),
  points: z.number().int(),
});

export async function createGameMove(
  input: z.infer<typeof createGameMoveSchema>,
) {
  try {
    const { sessionId, points } = createGameMoveSchema.parse(input);

    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Get the game session
    const gameSession = await db.query.game_session.findFirst({
      where: eq(game_session.id, sessionId),
    });

    if (!gameSession) {
      throw new Error("Game session not found");
    }

    // Get existing moves count
    const existingMoves = await db.query.game_move.findMany({
      where: eq(game_move.session_id, sessionId),
    });

    // Calculate if this is the last move
    const totalPlayers = gameSession.players.length;
    const currentRound = Math.floor(existingMoves.length / totalPlayers);
    const isLastRound = currentRound === totalPlayers - 1;
    const isLastPlayer = (existingMoves.length + 1) % totalPlayers === 0;

    // Create the move
    await db.insert(game_move).values({
      session_id: sessionId,
      player_id: session.user.id,
      player_username: session.user.username,
      points: points,
    });

    // If this is the last move of the last round, update game session status
    if (isLastRound && isLastPlayer) {
      await db
        .update(game_session)
        .set({ status: "completed" })
        .where(eq(game_session.id, sessionId));
    }

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid input data" };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    Sentry.captureException(error);
    return { success: false, error: "Unknown error occurred" };
  }
}
