"use server";

import { z } from "zod";
import { db } from "~/server/db";
import { game_session, GameType } from "~/server/db/schema";
import { desc, eq, sql } from "drizzle-orm";
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

export type GamePlayer = {
  username: string;
  display_name: string | null;
  fid: number;
  pfp_url: string | null;
  avatar_url: string | null;
  user_id: string;
};

export type GetGamePlayerInfoResponse =
  | {
      success: true;
      data: GamePlayer[];
    }
  | {
      success: false;
      error: string;
    };

export async function getGamePlayerInfo(
  id: string,
): Promise<GetGamePlayerInfoResponse> {
  try {
    const [session] = await db
      .select()
      .from(game_session)
      .where(eq(game_session.id, id));

    if (!session) {
      return { success: false as const, error: "Game session not found" };
    }

    return { success: true as const, data: session.player_info };
  } catch (error) {
    console.error("Error fetching game player info:", error);
    return {
      success: false as const,
      error: "Failed to fetch game player info",
    };
  }
}

export type GetGameSessionResponse =
  | {
      success: true;
      data: GameSession;
    }
  | {
      success: false;
      error: string;
    };

export async function getGameSession(
  id: string,
): Promise<GetGameSessionResponse> {
  try {
    const [session] = await db
      .select()
      .from(game_session)
      .where(eq(game_session.id, id));

    if (!session) {
      return { success: false as const, error: "Game session not found" };
    }

    return { success: true as const, data: session };
  } catch (error) {
    console.error("Error fetching game session:", error);
    return {
      success: false as const,
      error: "Failed to fetch game session",
    };
  }
}
