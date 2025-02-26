import "server-only";

import { Redis } from "@upstash/redis";
import { verifySignatureAppRouter } from "@upstash/qstash/dist/nextjs";
import { db } from "~/server/db";
import { processExpiredTurn } from "~/server/services/spinwheel/deadline";
import { eq } from "drizzle-orm";
import { game_move, game_session } from "~/server/db/schema";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

async function handler(req: Request) {
  const { gameId, turnIndex } = await req.json();

  // Check if this turn was already processed
  const processedKey = `game:${gameId}:turn:${turnIndex}:processed`;
  const wasProcessed = await redis.get(processedKey);
  if (wasProcessed) {
    return new Response("Turn already processed", { status: 200 });
  }

  // Get current game state
  const game = await db.query.game_session.findFirst({
    where: eq(game_session.id, gameId),
  });

  if (!game) {
    return new Response("Game not found", { status: 404 });
  }

  if (game.status !== "in_progress") {
    return new Response("Game is not in progress", { status: 200 });
  }

  if (game.current_turn_player_index !== turnIndex) {
    return new Response("Turn index mismatch", { status: 200 });
  }

  // Check if the player has already made their move
  const existingMove = await db.query.game_move.findFirst({
    where: eq(game_move.session_id, gameId),
    orderBy: (moves, { desc }) => [desc(moves.created_at)],
  });

  if (
    existingMove &&
    new Date(existingMove.created_at) > new Date(game.turn_deadline)
  ) {
    return new Response("Move already made", { status: 200 });
  }

  // Only process if this is a spin-wheel game
  if (game.game_type !== "spin-wheel") {
    return new Response("Not a spin-wheel game", { status: 200 });
  }

  // Process expired turn and schedule next
  await processExpiredTurn(game);

  // Mark this turn as processed
  await redis.setex(processedKey, 24 * 60 * 60, "true"); // 24hr TTL
  // await redis.setex(processedKey, 10, "true"); // 10s TTL for testing

  return new Response("Success", { status: 200 });
}

// Wrap with QStash verification
export const POST = verifySignatureAppRouter(handler);
