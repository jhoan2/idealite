// src/app/api/v1/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import {
  getCardActivityStats,
  getTagsMasteryData,
  getCardStatusDistribution,
  type CardActivityStats,
  type TagMasteryData,
  type CardStatusData,
} from "~/server/queries/dashboard";

export type DashboardResponse = {
  cardActivity: CardActivityStats;
  tagMastery: TagMasteryData[];
  cardDistribution: CardStatusData[];
  totalCards: number;
};

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all dashboard data in parallel for better performance
    const [cardActivity, tagMastery, cardDistribution] = await Promise.all([
      getCardActivityStats(),
      getTagsMasteryData(),
      getCardStatusDistribution(),
    ]);

    // Calculate total cards from distribution data
    const totalCards = cardDistribution.reduce(
      (sum, item) => sum + item.count,
      0,
    );

    const dashboardData: DashboardResponse = {
      cardActivity,
      tagMastery,
      cardDistribution,
      totalCards,
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);

    Sentry.captureException(error, {
      tags: {
        api: "dashboard",
        endpoint: "/api/v1/dashboard",
      },
      extra: {
        userId: await currentUser()
          .then((user) => user?.externalId)
          .catch(() => null),
      },
    });

    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
