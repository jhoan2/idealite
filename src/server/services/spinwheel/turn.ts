import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { game_move, game_session, GameMove } from "~/server/db/schema";
import { isLastTurn, scheduleNextTurnDeadline } from "./deadline";
import { distributeGamePoints } from "~/server/actions/gamePoints";
export async function completeTurn(gameId: string, points: number) {
  const game = await db.query.game_session.findFirst({
    where: eq(game_session.id, gameId),
  });

  if (!game) throw new Error("Game not found");

  // Only proceed if this is a spin-wheel game
  if (game.game_type !== "spin-wheel") {
    throw new Error("Invalid game type");
  }

  // Get all moves to determine if this will be the last turn
  const moves = await db.query.game_move.findMany({
    where: eq(game_move.session_id, gameId),
  });

  const lastTurn = isLastTurn(game, moves);
  const nextPlayerIndex = lastTurn
    ? game.current_turn_player_index
    : (game.current_turn_player_index + 1) % game.player_count;

  await db.transaction(async (tx) => {
    // Record completed turn
    await tx.insert(game_move).values({
      session_id: game.id,
      player_id:
        game.player_info[game.current_turn_player_index]?.user_id ?? "",
      player_username:
        game.player_info[game.current_turn_player_index]?.username ?? "",
      points: points,
    } as GameMove);

    if (lastTurn) {
      // Mark game as completed if this was the last turn
      await tx
        .update(game_session)
        .set({
          status: "completed",
          current_turn_player_index: game.current_turn_player_index,
        })
        .where(eq(game_session.id, game.id));
      await distributeGamePoints(game.id, tx);
      const BASE_URL =
        //comment NEXT_PUBLIC_DEPLOYMENT_URL out for local testing with ngrok
        process.env.NEXT_PUBLIC_DEPLOYMENT_URL ??
        "dfbe-2601-646-8900-8b60-3c90-252f-31fd-6c62.ngrok-free.app";

      // Notify all players that the game is completed
      await fetch(`https://${BASE_URL}/api/notifications`, {
        method: "POST",
        body: JSON.stringify({
          type: "GAME_COMPLETED",
          gameId,
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
        gameId,
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

      // Notify the next player that it's their turn
      await fetch(`https://${BASE_URL}/api/notifications`, {
        method: "POST",
        body: JSON.stringify({
          type: "NEW_TURN",
          gameId,
          targetFids: [nextPlayer?.fid],
          username: nextPlayer?.username,
          gameType: "spin-wheel",
          title: "Your Turn in Spin the Wheel! 🎮",
          body: `Hey @${nextPlayer?.username}! It's your turn to play.`,
        }),
      });
    }
  });

  return { success: true };
}
