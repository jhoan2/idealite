"use server";

import { db } from "~/server/db";
import {
  game_move,
  game_session,
  points_history,
  users,
} from "~/server/db/schema";
import { auth } from "~/app/auth";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { eq, sql } from "drizzle-orm";

const createGameMoveSchema = z.object({
  sessionId: z.string().uuid(),
  points: z.number().int(),
});

async function distributeGamePoints(sessionId: string) {
  try {
    // Get all moves for this session
    const moves = await db.query.game_move.findMany({
      where: eq(game_move.session_id, sessionId),
    });

    // Calculate total points per player
    const playerScores = moves.reduce(
      (acc, move) => {
        acc[move.player_id] = (acc[move.player_id] || 0) + move.points;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Find highest score
    const highestScore = Math.max(...Object.values(playerScores));

    // Identify winners and losers
    const winners = Object.entries(playerScores)
      .filter(([_, score]) => score === highestScore)
      .map(([playerId]) => playerId);

    const losers = Object.entries(playerScores)
      .filter(([_, score]) => score < highestScore)
      .map(([playerId]) => playerId);

    // Start a transaction to update points
    await db.transaction(async (tx) => {
      // Award points to winners (5 points each)
      for (const winnerId of winners) {
        await tx.insert(points_history).values({
          user_id: winnerId,
          points: 5,
          source_type: "game_move",
          source_id: sessionId,
        });

        await tx
          .update(users)
          .set({
            points: sql`${users.points} + 5`,
          })
          .where(eq(users.id, winnerId));
      }

      // Award points to losers (1 point each)
      for (const loserId of losers) {
        await tx.insert(points_history).values({
          user_id: loserId,
          points: 1,
          source_type: "game_move",
          source_id: sessionId,
        });

        await tx
          .update(users)
          .set({
            points: sql`${users.points} + 1`,
          })
          .where(eq(users.id, loserId));
      }
    });

    return true;
  } catch (error) {
    Sentry.captureException(error);
    return false;
  }
}

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

    // Calculate next player's turn
    const nextPlayerIndex =
      (gameSession.current_turn_player_index + 1) % totalPlayers;

    // Create the move
    await db.insert(game_move).values({
      session_id: sessionId,
      player_id: session.user.id,
      player_username: session.user.username,
      points: points,
    });

    // If this is the last move of the last round, update game session status
    if (isLastRound && isLastPlayer) {
      // Update game session status
      await db
        .update(game_session)
        .set({
          status: "completed",
          current_turn_player_index: gameSession.current_turn_player_index,
        })
        .where(eq(game_session.id, sessionId));

      // Distribute points to players
      await distributeGamePoints(sessionId);
    } else {
      // Just update the turn index
      await db
        .update(game_session)
        .set({
          current_turn_player_index: nextPlayerIndex,
        })
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
