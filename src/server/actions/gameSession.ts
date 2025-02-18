"use server";

import { game_session, GameType } from "~/server/db/schema";
import { auth } from "~/app/auth";
import { db } from "~/server/db";
import { eq } from "drizzle-orm";

export async function createGameSession({
  playerCount,
  players,
  gameType,
}: {
  playerCount: number;
  players: string[];
  gameType: GameType;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const turnDeadline = new Date();
  turnDeadline.setHours(turnDeadline.getHours() + 24);

  // Create the game session
  const gameSession = await db
    .insert(game_session)
    .values({
      player_count: playerCount,
      players,
      status: "created",
      turn_deadline: turnDeadline,
      eliminated_players: [],
      current_turn_player_index: 0,
      game_type: gameType,
    })
    .returning();

  return gameSession[0];
}

// Optional: Helper function to join a game session
export async function joinGameSession(gameSessionId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Get the current game session
  const [existingSession] = await db
    .select()
    .from(game_session)
    .where(eq(game_session.id, gameSessionId));

  if (!existingSession) {
    throw new Error("Game session not found");
  }

  if (existingSession.players.length >= existingSession.player_count) {
    throw new Error("Game session is full");
  }

  if (existingSession.players.includes(session.user.id)) {
    throw new Error("Already joined this game session");
  }

  // Add the player to the game session
  const updatedSession = await db
    .update(game_session)
    .set({
      players: [...existingSession.players, session.user.id],
    })
    .where(eq(game_session.id, gameSessionId))
    .returning();

  return updatedSession[0];
}
