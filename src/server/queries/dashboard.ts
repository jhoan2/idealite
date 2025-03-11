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
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

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
        eq(cards.user_id, userId),
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
        eq(cards.user_id, userId),
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
        eq(cards.user_id, userId),
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
        eq(cards.user_id, userId),
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
        eq(cards.user_id, userId),
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
        eq(cards.user_id, userId),
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
        eq(cards.user_id, userId),
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
        eq(cards.user_id, userId),
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
        eq(cards.user_id, userId),
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
        eq(cards.user_id, userId),
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
