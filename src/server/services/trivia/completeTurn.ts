import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { game_move, game_session, GameMove } from "~/server/db/schema";
import { isLastTurn, scheduleNextTurnDeadline } from "./deadlines";

export async function completeTurn(gameId: string, points: number) {
  const game = await db.query.game_session.findFirst({
    where: eq(game_session.id, gameId),
  });

  if (!game) throw new Error("Game not found");

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
      await fetch("http://localhost:3000/api/notifications", {
        method: "POST",
        body: JSON.stringify({
          type: "GAME_COMPLETED",
          gameId,
          username: game.players.join(","), // Notify all players
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
      const nextPlayer = game.player_info[nextPlayerIndex]?.username;
      await fetch(
        `${process.env.NEXT_PUBLIC_DEPLOYMENT_URL}/api/notifications`,
        {
          method: "POST",
          body: JSON.stringify({
            type: "NEW_TURN",
            gameId,
            username: nextPlayer,
          }),
        },
      );
    }
  });
}
