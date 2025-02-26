import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { processExpiredTurn as processExpiredFriendClashTurn } from "~/server/services/trivia/deadlines";
import { game_move, game_session, GameMove } from "~/server/db/schema";
import { GameSession } from "~/server/db/schema";
import { Client } from "@upstash/qstash";
import { distributeGamePoints } from "~/server/actions/gamePoints";

const qstash = new Client({ token: process.env.QSTASH_TOKEN! });

export async function processExpiredTurn(game: GameSession) {
  if (game.game_type === "spin-wheel") {
    // Get all moves to determine if this is the last turn
    const moves = await db.query.game_move.findMany({
      where: eq(game_move.session_id, game.id),
    });

    // Check if this will be the last turn before processing
    const isLast = isLastTurn(game, moves);

    // Calculate next player index
    const nextPlayerIndex = isLast
      ? game.current_turn_player_index
      : (game.current_turn_player_index + 1) % game.player_count;

    // Start a transaction
    await db.transaction(async (tx) => {
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

        await distributeGamePoints(game.id, tx);

        const BASE_URL = process.env.NEXT_PUBLIC_DEPLOYMENT_URL;

        // Send completion notification to all players
        await fetch(`https://${BASE_URL}/api/notifications`, {
          method: "POST",
          body: JSON.stringify({
            type: "GAME_COMPLETED",
            gameId: game.id,
            targetFids: game.player_info.map((player) => player.fid),
            username: game.players.join(","),
            gameType: "spin-wheel",
            title: "Spin Wheel Game Completed! 🏆",
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
        const BASE_URL =
          //comment NEXT_PUBLIC_DEPLOYMENT_URL out for local testing with ngrok
          process.env.NEXT_PUBLIC_DEPLOYMENT_URL ??
          "dfbe-2601-646-8900-8b60-3c90-252f-31fd-6c62.ngrok-free.app";

        // Send new turn notification to next player
        await fetch(`https://${BASE_URL}/api/notifications`, {
          method: "POST",
          body: JSON.stringify({
            type: "NEW_TURN",
            gameId: game.id,
            targetFids: [nextPlayer?.fid],
            username: nextPlayer?.username,
            gameType: "spin-wheel",
            title: "Your Turn in Spin the Wheel! 🎮",
            body: `Hey @${nextPlayer?.username}! It's your turn to play.`,
          }),
        });
      }
    });
  } else {
    // Fall back to the friend-clash implementation for other game types
    return processExpiredFriendClashTurn(game);
  }
}

// Helper function to determine if this is the last turn
export function isLastTurn(game: GameSession, moves: GameMove[]) {
  const totalTurns = game.player_count * 3;
  //   const totalTurns = game.player_count * 1; // For testing

  const currentTurn = moves.length + 1;

  return currentTurn === totalTurns;
}

export async function scheduleNextTurnDeadline(
  gameId: string,
  turnIndex: number,
) {
  const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  //   const deadline = new Date(Date.now() + 10 * 1000); // 10 seconds for testing

  const BASE_URL =
    //comment NEXT_PUBLIC_DEPLOYMENT_URL out for local testing with ngrok
    process.env.NEXT_PUBLIC_DEPLOYMENT_URL ??
    "dfbe-2601-646-8900-8b60-3c90-252f-31fd-6c62.ngrok-free.app";

  if (!BASE_URL) {
    console.error("Missing BASE_URL environment variable");
    return deadline;
  }

  const domain = `https://${BASE_URL}`;
  const destinationUrl = `${domain}/api/game/checkSpinWheelDeadline`;

  // Schedule the QStash job
  await qstash.publishJSON({
    url: destinationUrl,
    body: { gameId, turnIndex },
    notBefore: Math.floor(deadline.getTime() / 1000),
    retries: 3,
  });

  return deadline;
}
