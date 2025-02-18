"use server";

import { z } from "zod";
import { db } from "~/server/db";
import { game_session, GameType } from "~/server/db/schema";
import { desc, sql } from "drizzle-orm";
import type { GameSession } from "~/server/db/schema";
import * as Sentry from "@sentry/nextjs";

const getUserGameSessionsSchema = z.object({
  username: z.string(),
});

export type GetUserGameSessionsResponse =
  | {
      success: true;
      data: GameSession[];
    }
  | {
      success: false;
      error: string;
    };

export async function getUserGameSessions(
  username: string,
  gameType: GameType,
): Promise<GetUserGameSessionsResponse> {
  try {
    const { username: validatedUsername } = getUserGameSessionsSchema.parse({
      username,
    });

    const sessions = await db.query.game_session.findMany({
      where: sql`${validatedUsername}::text = ANY(${game_session.players}) AND ${game_session.game_type} = ${gameType}`,
      orderBy: [desc(game_session.created_at)],
    });

    return {
      success: true,
      data: sessions,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid username format",
      };
    }

    Sentry.captureException(error);

    return {
      success: false,
      error: "Failed to fetch game sessions",
    };
  }
}
