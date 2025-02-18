"use server";

import { game_session, GameType } from "~/server/db/schema";
import { auth } from "~/app/auth";
import { db } from "~/server/db";
import { eq } from "drizzle-orm";
import { users } from "~/server/db/schema";

/**
 * Helper function that takes a username, looks up the user's information,
 * and returns an object matching the structure required for "player_info".
 * If the user does not exist, it returns default values.
 */
async function getPlayerInfo(username: string): Promise<{
  username: string;
  display_name: string | null;
  fid: number;
  pfp_url: string | null;
  avatar_url: string | null;
  user_id: string;
}> {
  const [userRecord] = await db
    .select({
      display_name: users.display_name,
      avatar_url: users.avatar_url,
      pfp_url: users.pfp_url,
      id: users.id,
      fid: users.fid,
    })
    .from(users)
    .where(eq(users.username, username));

  if (userRecord) {
    return {
      username: username,
      display_name: userRecord.display_name,
      fid: userRecord.fid || 0,
      pfp_url: userRecord.pfp_url,
      avatar_url: userRecord.avatar_url,
      user_id: userRecord.id,
    };
  }

  // If the user is not found in the database, set default values:
  return {
    username,
    display_name: null,
    fid: 0,
    pfp_url: null,
    avatar_url: null,
    user_id: "",
  };
}

/**
 * Creates a new game session.
 * It accepts a player count, an array of usernames, and a game type.
 * The helper function populates the "player_info" JSONB field using the supplied usernames.
 */
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

  const playerInfo = await Promise.all(
    players.map((username) => getPlayerInfo(username)),
  );

  const [newGameSession] = await db
    .insert(game_session)
    .values({
      player_count: playerCount,
      players,
      player_info: playerInfo,
      eliminated_players: [],
      current_turn_player_index: 0,
      game_type: gameType,
      turn_deadline: turnDeadline,
    })
    .returning();

  return newGameSession;
}
