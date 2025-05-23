"use server";
import { db } from "~/server/db";
import { cards, cards_tags, tags, users_tags } from "~/server/db/schema";
import { sql, and, eq, count, or } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";

// Define types for the tag mastery data
export type TagMasteryRawData = {
  tagName: string;
  status: string;
  count: number;
};

export type TagMasteryData = {
  name: string;
  mastered: number;
  active: number;
  suspended: number;
  total: number;
};

export async function getTagsMasteryData(): Promise<TagMasteryData[]> {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");
  const { externalId } = user;
  if (!externalId) throw new Error("Unauthorized");

  const result = await db
    .select({
      tagName: tags.name,
      status: cards.status,
      count: count(),
    })
    .from(cards)
    .innerJoin(cards_tags, eq(cards.id, cards_tags.card_id))
    .innerJoin(tags, eq(cards_tags.tag_id, tags.id))
    .leftJoin(
      users_tags,
      and(eq(tags.id, users_tags.tag_id), eq(users_tags.user_id, externalId)),
    )
    .where(
      and(
        eq(cards.user_id, externalId),
        eq(cards.deleted, false),
        eq(tags.deleted, false),
        // Exclude the "root" tag by ID
        sql`${tags.id} != 'fbb1f204-6500-4b60-ab64-e1a9b3a5da88'`,
        // Exclude archived tags (if is_archived is null, it's not in users_tags so include it)
        or(
          sql`${users_tags.is_archived} IS NULL`,
          eq(users_tags.is_archived, false),
        ),
      ),
    )
    .groupBy(tags.name, cards.status)
    .orderBy(tags.name);

  // Transform for chart consumption
  const tagMap = new Map<
    string,
    {
      name: string;
      active: number;
      mastered: number;
      suspended: number;
      total: number;
    }
  >();

  result.forEach((row) => {
    if (!tagMap.has(row.tagName)) {
      tagMap.set(row.tagName, {
        name: row.tagName,
        active: 0,
        mastered: 0,
        suspended: 0,
        total: 0,
      });
    }

    const tag = tagMap.get(row.tagName);
    if (tag) {
      tag[row.status] = row.count;
      tag.total += row.count;
    }
  });

  // Calculate percentages and limit to top 7 tags with most cards
  const chartData = Array.from(tagMap.values())
    .filter((tag) => tag.total >= 3) // Only include tags with at least 3 cards
    .sort((a, b) => b.total - a.total) // Sort by total card count (descending)
    .slice(0, 7) // Take top 7 tags
    .map((tag) => ({
      name: tag.name,
      // Calculate percentages, handling division by zero
      mastered:
        tag.total > 0 ? Math.round((tag.mastered / tag.total) * 100) : 0,
      active: tag.total > 0 ? Math.round((tag.active / tag.total) * 100) : 0,
      suspended:
        tag.total > 0 ? Math.round((tag.suspended / tag.total) * 100) : 0,
      total: tag.total, // Keep total for reference
    }));

  return chartData;
}

export type CardStatusData = {
  status: string;
  count: number;
  color: string;
};

export async function getCardStatusDistribution(): Promise<CardStatusData[]> {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");
  const { externalId } = user;
  if (!externalId) throw new Error("Unauthorized");

  const result = await db
    .select({
      status: cards.status,
      count: count(),
    })
    .from(cards)
    .where(and(eq(cards.user_id, externalId), eq(cards.deleted, false)))
    .groupBy(cards.status);

  // Transform to add colors
  const statusColors = {
    active: "hsl(var(--chart-6))",
    mastered: "hsl(var(--chart-7))",
    suspended: "hsl(var(--chart-8))",
  };

  const statusLabels = {
    active: "Learning",
    mastered: "Mastered",
    suspended: "Paused",
  };

  return result.map((row) => ({
    status: statusLabels[row.status as keyof typeof statusLabels] || row.status,
    count: row.count,
    color: statusColors[row.status as keyof typeof statusColors] || "#888888",
  }));
}

export type CardActivityStats = {
  cardsCreatedThisWeek: number;
  cardsReviewedThisWeek: number;
  cardsDueThisWeek: number;
  reviewCompletionRate: number;
  createdChangePercent: number;
  reviewedChangePercent: number;
  dueChangePercent: number;
  completionRateChange: number;
};

export async function getCardActivityStats(): Promise<CardActivityStats> {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");
  const { externalId } = user;
  if (!externalId) throw new Error("Unauthorized");

  // Define time ranges
  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const oneWeekFromNow = new Date(now);
  oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

  // THIS WEEK STATS
  // Query for cards created this week
  const createdThisWeekResult = await db
    .select({ count: count() })
    .from(cards)
    .where(
      and(
        eq(cards.user_id, externalId),
        eq(cards.deleted, false),
        sql`${cards.created_at} >= ${oneWeekAgo}`,
      ),
    );

  // Query for cards reviewed this week
  const reviewedThisWeekResult = await db
    .select({ count: count() })
    .from(cards)
    .where(
      and(
        eq(cards.user_id, externalId),
        eq(cards.deleted, false),
        sql`${cards.last_reviewed} >= ${oneWeekAgo}`,
      ),
    );

  // Query for cards due this week
  const dueThisWeekResult = await db
    .select({ count: count() })
    .from(cards)
    .where(
      and(
        eq(cards.user_id, externalId),
        eq(cards.deleted, false),
        eq(cards.status, "active"),
        sql`${cards.next_review} <= ${oneWeekFromNow}`,
        sql`${cards.next_review} >= CURRENT_DATE`,
      ),
    );

  // Query for completion rate this week
  const dueAndReviewedThisWeekResult = await db
    .select({ count: count() })
    .from(cards)
    .where(
      and(
        eq(cards.user_id, externalId),
        eq(cards.deleted, false),
        sql`${cards.next_review} <= ${now}`,
        sql`${cards.last_reviewed} >= ${oneWeekAgo}`,
      ),
    );

  const dueCardsThisWeekResult = await db
    .select({ count: count() })
    .from(cards)
    .where(
      and(
        eq(cards.user_id, externalId),
        eq(cards.deleted, false),
        sql`${cards.next_review} <= ${now}`,
      ),
    );

  // LAST WEEK STATS
  // Query for cards created last week
  const createdLastWeekResult = await db
    .select({ count: count() })
    .from(cards)
    .where(
      and(
        eq(cards.user_id, externalId),
        eq(cards.deleted, false),
        sql`${cards.created_at} >= ${twoWeeksAgo}`,
        sql`${cards.created_at} < ${oneWeekAgo}`,
      ),
    );

  // Query for cards reviewed last week
  const reviewedLastWeekResult = await db
    .select({ count: count() })
    .from(cards)
    .where(
      and(
        eq(cards.user_id, externalId),
        eq(cards.deleted, false),
        sql`${cards.last_reviewed} >= ${twoWeeksAgo}`,
        sql`${cards.last_reviewed} < ${oneWeekAgo}`,
      ),
    );

  // Query for cards that were due last week
  const dueLastWeekStart = new Date(oneWeekAgo);
  dueLastWeekStart.setDate(dueLastWeekStart.getDate() - 7);

  const dueLastWeekResult = await db
    .select({ count: count() })
    .from(cards)
    .where(
      and(
        eq(cards.user_id, externalId),
        eq(cards.deleted, false),
        eq(cards.status, "active"),
        sql`${cards.next_review} <= ${oneWeekAgo}`,
        sql`${cards.next_review} >= ${dueLastWeekStart}`,
      ),
    );

  // Query for completion rate last week
  const lastWeekDate = new Date(oneWeekAgo);

  const dueAndReviewedLastWeekResult = await db
    .select({ count: count() })
    .from(cards)
    .where(
      and(
        eq(cards.user_id, externalId),
        eq(cards.deleted, false),
        sql`${cards.next_review} <= ${lastWeekDate}`,
        sql`${cards.last_reviewed} >= ${twoWeeksAgo}`,
        sql`${cards.last_reviewed} < ${oneWeekAgo}`,
      ),
    );

  const dueCardsLastWeekResult = await db
    .select({ count: count() })
    .from(cards)
    .where(
      and(
        eq(cards.user_id, externalId),
        eq(cards.deleted, false),
        sql`${cards.next_review} <= ${lastWeekDate}`,
      ),
    );

  // Extract counts from results
  const cardsCreatedThisWeek = createdThisWeekResult[0]?.count || 0;
  const cardsReviewedThisWeek = reviewedThisWeekResult[0]?.count || 0;
  const cardsDueThisWeek = dueThisWeekResult[0]?.count || 0;
  const dueAndReviewedThisWeek = dueAndReviewedThisWeekResult[0]?.count || 0;
  const totalDueCardsThisWeek = dueCardsThisWeekResult[0]?.count || 0;

  const cardsCreatedLastWeek = createdLastWeekResult[0]?.count || 0;
  const cardsReviewedLastWeek = reviewedLastWeekResult[0]?.count || 0;
  const cardsDueLastWeek = dueLastWeekResult[0]?.count || 0;
  const dueAndReviewedLastWeek = dueAndReviewedLastWeekResult[0]?.count || 0;
  const totalDueCardsLastWeek = dueCardsLastWeekResult[0]?.count || 0;

  // Calculate completion rates
  const reviewCompletionRate =
    totalDueCardsThisWeek > 0
      ? Math.round((dueAndReviewedThisWeek / totalDueCardsThisWeek) * 100)
      : 100;

  const lastWeekCompletionRate =
    totalDueCardsLastWeek > 0
      ? Math.round((dueAndReviewedLastWeek / totalDueCardsLastWeek) * 100)
      : 100;

  // Calculate week-over-week changes
  function calculatePercentChange(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0; // 100% increase if previous was 0
    }
    return Math.round(((current - previous) / previous) * 100);
  }

  const createdChangePercent = calculatePercentChange(
    cardsCreatedThisWeek,
    cardsCreatedLastWeek,
  );
  const reviewedChangePercent = calculatePercentChange(
    cardsReviewedThisWeek,
    cardsReviewedLastWeek,
  );
  const dueChangePercent = calculatePercentChange(
    cardsDueThisWeek,
    cardsDueLastWeek,
  );
  const completionRateChange = reviewCompletionRate - lastWeekCompletionRate; // Percentage point change

  return {
    cardsCreatedThisWeek,
    cardsReviewedThisWeek,
    cardsDueThisWeek,
    reviewCompletionRate,
    createdChangePercent,
    reviewedChangePercent,
    dueChangePercent,
    completionRateChange,
  };
}
