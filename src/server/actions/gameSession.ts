"use server";

import { game_session, GameType } from "~/server/db/schema";
import { auth } from "~/app/auth";
import { db } from "~/server/db";
import { eq, sql } from "drizzle-orm";
import { users } from "~/server/db/schema";
import { revalidatePath } from "next/cache";
import { scheduleNextTurnDeadline } from "../services/trivia/deadlines";

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

  revalidatePath(`/play/friend-clash/games`);

  return newGameSession;
}

export async function createSpinTheWheelGameSession({
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

  // Get 10 random template tags
  const templateTags = await db.query.tags.findMany({
    where: (tags, { and, eq, ne }) =>
      and(
        eq(tags.is_template, true),
        eq(tags.deleted, false),
        ne(tags.id, "fbb1f204-6500-4b60-ab64-e1a9b3a5da88"),
      ),
    orderBy: () => sql`RANDOM()`,
    limit: 10,
  });

  const tagNames = templateTags.map((tag) => tag.name);

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
      topics: tagNames,
    })
    .returning();

  revalidatePath(`/play/spin-wheel/games`);

  return newGameSession;
}

export async function removePlayerFromGame({
  gameId,
  username,
}: {
  gameId: string;
  username: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [gameSession] = await db
    .select()
    .from(game_session)
    .where(eq(game_session.id, gameId));

  if (!gameSession) {
    throw new Error("Game session not found");
  }

  if (gameSession.players[0] !== session.user.username) {
    throw new Error("Only the host can remove players");
  }

  const updatedPlayers = gameSession.players.filter(
    (player) => player !== username,
  );
  const updatedPlayerInfo = gameSession.player_info.filter(
    (player) => player.username !== username,
  );

  await db
    .update(game_session)
    .set({
      players: updatedPlayers,
      player_info: updatedPlayerInfo,
      player_count: updatedPlayers.length,
    })
    .where(eq(game_session.id, gameId));

  revalidatePath(`/play/friend-clash/games/${gameId}`);

  return { success: true };
}

export async function startGame(gameId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [gameSession] = await db
    .select()
    .from(game_session)
    .where(eq(game_session.id, gameId));

  if (!gameSession) {
    throw new Error("Game session not found");
  }

  if (gameSession.players[0] !== session.user.username) {
    throw new Error("Only the host can start the game");
  }

  const deadline = await scheduleNextTurnDeadline(gameId, 0);

  await db
    .update(game_session)
    .set({
      status: "in_progress",
      turn_deadline: deadline,
    })
    .where(eq(game_session.id, gameId));

  revalidatePath(`/play/friend-clash/games/${gameId}`);

  return { success: true };
}

export async function endGame(gameId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [gameSession] = await db
    .select()
    .from(game_session)
    .where(eq(game_session.id, gameId));

  if (!gameSession) {
    throw new Error("Game session not found");
  }

  if (gameSession.players[0] !== session.user.username) {
    throw new Error("Only the host can end the game");
  }

  await db
    .update(game_session)
    .set({
      status: "abandoned",
    })
    .where(eq(game_session.id, gameId));

  revalidatePath(`/play/friend-clash/games/${gameId}`);
}

export async function addTopicToGame(gameId: string, topic: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [gameSession] = await db
    .select()
    .from(game_session)
    .where(eq(game_session.id, gameId));

  if (!gameSession) {
    throw new Error("Game session not found");
  }

  if (!gameSession.players.includes(session.user.username)) {
    throw new Error("Only players can add topics");
  }

  // Calculate the next turn using modulo. This will cycle through the players.
  const currentTurn = gameSession.current_turn_player_index;
  const playersCount = gameSession.players.length;
  const nextTurnIndex = (currentTurn + 1) % playersCount;

  await db
    .update(game_session)
    .set({
      topics: [...(gameSession.topics || []), topic],
      current_turn_player_index: nextTurnIndex,
    })
    .where(eq(game_session.id, gameId));

  revalidatePath(`/play/friend-clash/games/${gameId}`);

  return { success: true };
}
