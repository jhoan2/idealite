"use server";

import { z } from "zod";
import { db } from "~/server/db";
import {
  game_session,
  GameType,
  tags,
  users,
  users_tags,
  game_move,
} from "~/server/db/schema";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import type { GameSession, GameMove } from "~/server/db/schema";
import * as Sentry from "@sentry/nextjs";
import { auth } from "~/app/auth";

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
    Sentry.captureException(error);
    return {
      success: false as const,
      error: "Failed to fetch game player info",
    };
  }
}

export type GameSessionWithMoves = GameSession & {
  moves: GameMove[];
};

export type GetGameSessionResponse =
  | {
      success: true;
      data: GameSessionWithMoves;
    }
  | {
      success: false;
      error: string;
    };

export async function getGameSession(id: string) {
  try {
    const gameSession = await db.query.game_session.findFirst({
      where: eq(game_session.id, id),
      with: {
        moves: true,
      },
    });

    if (!gameSession) {
      return { success: false, error: "Game session not found" };
    }

    const timeRemaining =
      new Date(gameSession.turn_deadline).getTime() - Date.now();
    const isExpired = timeRemaining <= 0;

    return {
      success: true,
      data: {
        ...gameSession,
        deadlineExpired: isExpired,
        timeRemaining,
      },
    };
  } catch (error) {
    return { success: false, error: "Failed to fetch game session" };
  }
}

export async function getPlayersRecentTags(usernames: string[]) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const userTagsPromises = usernames.map(async (username) => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));

      if (!user) {
        return [];
      }

      const recentTags = await db
        .select({
          id: tags.id,
          name: tags.name,
        })
        .from(users_tags)
        .innerJoin(tags, eq(users_tags.tag_id, tags.id))
        .where(
          and(
            eq(users_tags.user_id, user.id),
            eq(users_tags.is_archived, false),
            ne(tags.id, "fbb1f204-6500-4b60-ab64-e1a9b3a5da88"),
          ),
        )
        .orderBy(desc(users_tags.created_at))
        .limit(10);

      return {
        username,
        tags: recentTags,
      };
    });

    const allUserTags = await Promise.all(userTagsPromises);

    return {
      success: true,
      data: allUserTags,
    };
  } catch (error) {
    console.error("Error fetching players recent tags:", error);
    Sentry.captureException(error);
    return {
      success: false,
      error: "Failed to fetch players recent tags",
    };
  }
}
