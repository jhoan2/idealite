"use server";

import { game_session } from "~/server/db/schema";
import { auth } from "~/app/auth";
import { db } from "~/server/db";
import { eq } from "drizzle-orm";

export async function createGameSession({
  playerCount,
  players,
}: {
  playerCount: number;
  players: string[];
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const turnDeadline = new Date();
  turnDeadline.setHours(turnDeadline.getHours() + 24);

  // Create the game session
  const gameSession = await db
    .insert(game_session)
    .values({
      playerCount,
      players,
      status: "created",
      turnDeadline,
      eliminatedPlayers: [],
      currentTurnPlayerIndex: 0,
    })
    .returning();

  return gameSession[0];
}
