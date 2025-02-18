import { db } from "~/server/db";
import { game_session } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export async function getGameSessionData(gameId: string) {
  try {
    const [session] = await db
      .select({
        players: game_session.players,
      })
      .from(game_session)
      .where(eq(game_session.id, gameId));

    if (!session) {
      return { success: false, error: "Game session not found" };
    }

    return { success: true, data: session };
  } catch (error) {
    console.error("Error fetching game session:", error);
    return { success: false, error: "Failed to fetch game session" };
  }
}
