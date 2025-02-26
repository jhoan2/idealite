import { eq, sql, and } from "drizzle-orm";
import { users, points_history, game_move } from "~/server/db/schema";
import { GameMove } from "~/server/db/schema";
/**
 * Distributes points to users when a game is completed.
 * Winner gets 5 points, losers get 1 point.
 * Points are recorded in points_history table.
 *
 * Can be used with any game type.
 *
 * @param gameSessionId The ID of the completed game session
 * @param tx The transaction object
 */
export async function distributeGamePoints(gameSessionId: string, tx: any) {
  // Check if points have already been distributed for this game
  const existingPoints = await tx.query.points_history.findFirst({
    where: and(
      eq(points_history.source_id, gameSessionId),
      eq(points_history.source_type, "game_move"),
    ),
  });

  if (existingPoints) {
    return {
      success: false,
      error: "Points already distributed for this game",
    };
  }

  // Fetch all moves for this game
  const moves = await tx.query.game_move.findMany({
    where: eq(game_move.session_id, gameSessionId),
  });

  // Group moves by player and sum their points
  const playerScores = new Map<string, { userId: string; points: number }>();

  moves.forEach((move: GameMove) => {
    const existingScore = playerScores.get(move.player_username) || {
      userId: move.player_id,
      points: 0,
    };

    playerScores.set(move.player_username, {
      userId: move.player_id,
      points: existingScore.points + move.points,
    });
  });

  // Find the highest score
  let highestScore = -1;

  playerScores.forEach((scoreData) => {
    if (scoreData.points > highestScore) {
      highestScore = scoreData.points;
    }
  });

  // Award and log points for all players
  const winners = [];

  for (const [username, scoreData] of playerScores.entries()) {
    const isWinner = scoreData.points === highestScore;
    const pointsToAward = isWinner ? 5 : 1;

    if (isWinner) {
      winners.push(username);
    }

    // Update user points
    await tx
      .update(users)
      .set({
        points: sql`${users.points} + ${pointsToAward}`,
      })
      .where(eq(users.id, scoreData.userId));

    // Record points history
    await tx.insert(points_history).values({
      user_id: scoreData.userId,
      points: pointsToAward,
      source_type: "game_move",
      source_id: gameSessionId,
    });
  }

  return {
    success: true,
    winners,
    playerScores: Object.fromEntries(playerScores),
  };
}
