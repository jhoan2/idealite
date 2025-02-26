import { eq } from "drizzle-orm";
import { Client } from "@upstash/qstash";
import { db } from "~/server/db";
import {
  game_move,
  game_session,
  GameSession,
  GameMove,
} from "~/server/db/schema";

const qstash = new Client({ token: process.env.QSTASH_TOKEN! });

export function isLastTurn(game: GameSession, moves: GameMove[]) {
  // Calculate total expected turns
  const totalTurns = game.player_count * game.player_count;

  // Current turn number (starting from 1)
  const currentTurn = moves.length + 1;

  // It's the last turn if this is the final expected turn
  return currentTurn === totalTurns;
}

export async function scheduleNextTurnDeadline(
  gameId: string,
  turnIndex: number,
) {
  const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  // const deadline = new Date(Date.now() + 10 * 1000); // 10 seconds for testing

  const BASE_URL =
    //comment NEXT_PUBLIC_DEPLOYMENT_URL out for local testing with ngrok
    process.env.NEXT_PUBLIC_DEPLOYMENT_URL ??
    "1ced-2601-646-8900-8b60-2864-1002-4368-e3ed.ngrok-free.app";

  if (!BASE_URL) {
    console.error("Missing BASE_URL environment variable");
    return deadline;
  }

  const domain = `https://${BASE_URL}`;
  const destinationUrl = `${domain}/api/game/checkTurnDeadline`;
  // Schedule the QStash job
  await qstash.publishJSON({
    url: destinationUrl,
    body: { gameId, turnIndex },
    notBefore: Math.floor(deadline.getTime() / 1000),
    retries: 3,
  });

  return deadline;
}

export async function processExpiredTurn(game: GameSession) {
  // Get all moves to determine if this is the last turn
  const moves = await db.query.game_move.findMany({
    where: eq(game_move.session_id, game.id),
  });
  // Check if this will be the last turn before processing
  const isLast = isLastTurn(game, moves);

  // Calculate next player index (will be used if not last turn)
  const nextPlayerIndex = isLast
    ? game.current_turn_player_index
    : (game.current_turn_player_index + 1) % game.player_count;

  // Start a transaction
  await db.transaction(async (tx) => {
    // Check if we're in topic selection phase
    const currentTopics = game.topics || [];
    if (currentTopics.length < game.player_count) {
      // Add default topic for the current player
      const defaultTopic =
        game.current_turn_player_index === 0 ? "biology" : "philosophy";
      const updatedTopics = [...currentTopics, defaultTopic];

      // Update the game session with the new topic
      await tx
        .update(game_session)
        .set({ topics: updatedTopics })
        .where(eq(game_session.id, game.id));

      if (updatedTopics.length === game.player_count) {
        const nextDeadline = await scheduleNextTurnDeadline(
          game.id,
          nextPlayerIndex,
        );

        await tx
          .update(game_session)
          .set({
            current_turn_player_index: nextPlayerIndex,
            turn_deadline: nextDeadline,
          })
          .where(eq(game_session.id, game.id));
      }
    }

    // Record missed turn
    await tx.insert(game_move).values({
      session_id: game.id,
      player_id:
        game.player_info[game.current_turn_player_index]?.user_id ?? "",
      player_username:
        game.player_info[game.current_turn_player_index]?.username ?? "",
      points: 0,
    } as GameMove);

    if (isLast) {
      // Mark game as completed if this was the last turn
      await tx
        .update(game_session)
        .set({
          status: "completed",
          current_turn_player_index: game.current_turn_player_index,
        })
        .where(eq(game_session.id, game.id));
      const BASE_URL = process.env.NEXT_PUBLIC_DEPLOYMENT_URL;

      await fetch(`https://${BASE_URL}/api/notifications`, {
        method: "POST",
        body: JSON.stringify({
          type: "GAME_COMPLETED",
          gameId: game.id,
          targetFids: game.player_info.map((player) => player.fid),
          username: game.players.join(","),
          title: "Friend Clash Game Completed! 🏆",
          body: "The game has ended! Check out the results.",
        }),
      });
    } else {
      // Schedule next turn's deadline
      const nextDeadline = await scheduleNextTurnDeadline(
        game.id,
        nextPlayerIndex,
      );

      // Update game session for next turn
      await tx
        .update(game_session)
        .set({
          current_turn_player_index: nextPlayerIndex,
          turn_deadline: nextDeadline,
        })
        .where(eq(game_session.id, game.id));

      const nextPlayer = game.player_info[nextPlayerIndex];
      const BASE_URL = process.env.NEXT_PUBLIC_DEPLOYMENT_URL;

      await fetch(`https://${BASE_URL}/api/notifications`, {
        method: "POST",
        body: JSON.stringify({
          type: "NEW_TURN",
          gameId: game.id,
          targetFids: [nextPlayer?.fid],
          username: nextPlayer?.username,
          title: "Your Turn in Friend Clash! 🎮",
          body: `Hey @${nextPlayer?.username}! It's your turn to play.`,
        }),
      });
    }
  });
}
