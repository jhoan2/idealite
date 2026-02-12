"use server";

import { Redis } from "@upstash/redis";
import { and, count, eq, inArray, sql } from "drizzle-orm";

import { db } from "~/server/db";
import { cards, cards_tags, tags, users_tags } from "~/server/db/schema";

const SKILL_GRAPH_CACHE_VERSION = "v3";
const SKILL_GRAPH_TTL_SECONDS = 60 * 15;
const MAX_AXES = 6;

type OwnedTagRow = {
  id: string;
  name: string;
  parentId: string | null;
};

type TagCardStatsRow = {
  tagId: string;
  totalCards: number;
  masteredCards: number;
  activeCards: number;
  overdueCards: number;
  freshCards: number;
  lastCardCreatedAt: string | null;
};

type AggregatedStats = {
  totalCards: number;
  masteredCards: number;
  activeCards: number;
  overdueCards: number;
  freshCards: number;
};

export type SkillGraphAxis = {
  id: string;
  skill: string;
  absoluteScore: number;
  displayScore: number;
  totalCards: number;
  masteredCards: number;
  activeCards: number;
  overdueCards: number;
  freshCards: number;
  lastCardCreatedAt: string | null;
};

export type SkillGraphData = {
  axes: SkillGraphAxis[];
  ownedTagCount: number;
  computedAt: string;
  ttlSeconds: number;
};

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

function getCacheKey(userId: string) {
  return `skillgraph:${SKILL_GRAPH_CACHE_VERSION}:user:${userId}`;
}

function emptySkillGraphData(ownedTagCount = 0): SkillGraphData {
  return {
    axes: [],
    ownedTagCount,
    computedAt: new Date().toISOString(),
    ttlSeconds: SKILL_GRAPH_TTL_SECONDS,
  };
}

function isSkillGraphData(value: unknown): value is SkillGraphData {
  if (!value || typeof value !== "object") return false;

  const data = value as Partial<SkillGraphData>;
  return (
    Array.isArray(data.axes) &&
    typeof data.computedAt === "string" &&
    typeof data.ownedTagCount === "number"
  );
}

function roundScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function defaultAggregatedStats(): AggregatedStats {
  return {
    totalCards: 0,
    masteredCards: 0,
    activeCards: 0,
    overdueCards: 0,
    freshCards: 0,
  };
}

function buildChildrenMap(ownedTags: OwnedTagRow[]) {
  const tagById = new Set(ownedTags.map((tag) => tag.id));
  const childrenByParent = new Map<string, string[]>();

  ownedTags.forEach((tag) => {
    if (!tag.parentId || !tagById.has(tag.parentId)) return;

    const existingChildren = childrenByParent.get(tag.parentId) ?? [];
    existingChildren.push(tag.id);
    childrenByParent.set(tag.parentId, existingChildren);
  });

  return childrenByParent;
}

function normalizeTimestamp(value: string | Date | null): string | null {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function computeScores<T extends { id: string; skill: string } & AggregatedStats>(
  axesWithStats: T[],
): Array<T & { absoluteScore: number; displayScore: number }> {
  if (axesWithStats.length === 0) return [];

  const maxTotalCards = Math.max(
    ...axesWithStats.map((axis) => axis.totalCards),
    1,
  );

  const axesWithAbsolute = axesWithStats.map((axis) => {
    const totalForRate = Math.max(axis.totalCards, 1);
    const activeForRate = Math.max(axis.activeCards, 1);

    const mastery = axis.masteredCards / totalForRate;
    const discipline = 1 - axis.overdueCards / activeForRate;
    const recency = axis.freshCards / totalForRate;
    const coverage = Math.log1p(axis.totalCards) / Math.log1p(maxTotalCards);
    const confidence = axis.totalCards / (axis.totalCards + 15);

    const raw =
      100 * (0.45 * mastery + 0.25 * discipline + 0.2 * recency + 0.1 * coverage);
    const absolute = confidence * raw + (1 - confidence) * 50;

    return {
      ...axis,
      absoluteScore: roundScore(absolute),
    };
  });

  const n = axesWithAbsolute.length;
  const sortedAbs = axesWithAbsolute
    .map((axis) => axis.absoluteScore)
    .sort((a, b) => a - b);

  return axesWithAbsolute.map((axis) => {
    // Tie-aware percentile rank so tied top tags do not all become 100.
    // Example: [0, 52, 52, 52] -> top group ~67 instead of 100.
    const firstIndex = sortedAbs.indexOf(axis.absoluteScore);
    const lastIndex = sortedAbs.lastIndexOf(axis.absoluteScore);
    const averageRank = (firstIndex + lastIndex) / 2 + 1;

    const display =
      n <= 1
        ? axis.absoluteScore
        : roundScore(((averageRank - 1) / (n - 1)) * 100);

    return {
      ...axis,
      displayScore: display,
    };
  });
}

async function computeSkillGraphData(userId: string): Promise<SkillGraphData> {
  const ownedTags = await db
    .select({
      id: tags.id,
      name: tags.name,
      parentId: tags.parent_id,
    })
    .from(tags)
    .innerJoin(users_tags, eq(users_tags.tag_id, tags.id))
    .where(
      and(
        eq(users_tags.user_id, userId),
        eq(users_tags.is_archived, false),
        eq(tags.deleted, false),
      ),
    );

  if (ownedTags.length === 0) {
    return emptySkillGraphData(0);
  }

  const rootTagId =
    process.env.ROOT_TAG_ID ?? process.env.NEXT_PUBLIC_ROOT_TAG_ID ?? null;

  const recentThreshold = new Date();
  recentThreshold.setDate(recentThreshold.getDate() - 30);

  const tagIds = ownedTags.map((tag) => tag.id);
  const tagCardStatsRaw = tagIds.length
    ? await db
        .select({
          tagId: cards_tags.tag_id,
          totalCards: count(cards.id),
          masteredCards: sql<number>`COALESCE(SUM(CASE WHEN ${cards.status} = 'mastered' THEN 1 ELSE 0 END), 0)`,
          activeCards: sql<number>`COALESCE(SUM(CASE WHEN ${cards.status} = 'active' THEN 1 ELSE 0 END), 0)`,
          overdueCards: sql<number>`COALESCE(SUM(CASE WHEN ${cards.status} = 'active' AND ${cards.next_review} IS NOT NULL AND ${cards.next_review} < NOW() THEN 1 ELSE 0 END), 0)`,
          freshCards: sql<number>`COALESCE(SUM(CASE WHEN ${cards.last_reviewed} IS NOT NULL AND ${cards.last_reviewed} >= ${recentThreshold} THEN 1 ELSE 0 END), 0)`,
          lastCardCreatedAt: sql<string | Date | null>`MAX(${cards.created_at})`,
        })
        .from(cards_tags)
        .innerJoin(
          cards,
          and(
            eq(cards_tags.card_id, cards.id),
            eq(cards.user_id, userId),
            eq(cards.deleted, false),
          ),
        )
        .where(inArray(cards_tags.tag_id, tagIds))
        .groupBy(cards_tags.tag_id)
    : [];

  const tagCardStats = new Map<string, TagCardStatsRow>();
  tagCardStatsRaw.forEach((row) => {
    tagCardStats.set(row.tagId, {
      tagId: row.tagId,
      totalCards: Number(row.totalCards),
      masteredCards: Number(row.masteredCards),
      activeCards: Number(row.activeCards),
      overdueCards: Number(row.overdueCards),
      freshCards: Number(row.freshCards),
      lastCardCreatedAt: normalizeTimestamp(row.lastCardCreatedAt),
    });
  });

  const childrenByParent = buildChildrenMap(ownedTags);
  const leafTags = ownedTags.filter((tag) => {
    if (rootTagId && tag.id === rootTagId) return false;
    return (childrenByParent.get(tag.id)?.length ?? 0) === 0;
  });

  if (leafTags.length === 0) {
    return emptySkillGraphData(ownedTags.length);
  }

  const leafAxes = leafTags.map((tag) => {
    const stats = tagCardStats.get(tag.id) ?? {
      ...defaultAggregatedStats(),
      lastCardCreatedAt: null,
    };
    return {
      id: tag.id,
      skill: tag.name,
      totalCards: stats.totalCards,
      masteredCards: stats.masteredCards,
      activeCards: stats.activeCards,
      overdueCards: stats.overdueCards,
      freshCards: stats.freshCards,
      lastCardCreatedAt: stats.lastCardCreatedAt,
    };
  });

  const rankedAxes = leafAxes
    .filter((axis) => axis.lastCardCreatedAt !== null)
    .sort((a, b) => {
      const aCreatedAt = a.lastCardCreatedAt
        ? new Date(a.lastCardCreatedAt).getTime()
        : 0;
      const bCreatedAt = b.lastCardCreatedAt
        ? new Date(b.lastCardCreatedAt).getTime()
        : 0;

      if (bCreatedAt !== aCreatedAt) return bCreatedAt - aCreatedAt;
      if (b.totalCards !== a.totalCards) return b.totalCards - a.totalCards;
      return a.skill.localeCompare(b.skill);
    })
    .slice(0, MAX_AXES);

  if (rankedAxes.length === 0) {
    return emptySkillGraphData(ownedTags.length);
  }

  const scoredAxes = computeScores(rankedAxes).map((axis) => ({
    id: axis.id,
    skill: axis.skill,
    absoluteScore: axis.absoluteScore,
    displayScore: axis.displayScore,
    totalCards: axis.totalCards,
    masteredCards: axis.masteredCards,
    activeCards: axis.activeCards,
    overdueCards: axis.overdueCards,
    freshCards: axis.freshCards,
    lastCardCreatedAt: axis.lastCardCreatedAt,
  }));

  return {
    axes: scoredAxes,
    ownedTagCount: ownedTags.length,
    computedAt: new Date().toISOString(),
    ttlSeconds: SKILL_GRAPH_TTL_SECONDS,
  };
}

export async function getSkillGraphDataForUser(
  userId: string,
): Promise<SkillGraphData> {
  if (!userId) return emptySkillGraphData();

  const cacheKey = getCacheKey(userId);

  if (redis) {
    try {
      const cached = await redis.get<SkillGraphData>(cacheKey);
      if (isSkillGraphData(cached)) {
        return cached;
      }
    } catch (error) {
      console.error("Skill graph cache read failed:", error);
    }
  }

  const computed = await computeSkillGraphData(userId);

  if (redis) {
    try {
      await redis.set(cacheKey, computed, { ex: SKILL_GRAPH_TTL_SECONDS });
    } catch (error) {
      console.error("Skill graph cache write failed:", error);
    }
  }

  return computed;
}
