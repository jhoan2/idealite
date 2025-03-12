"use server";

import { db } from "~/server/db";
import { feature_discoveries } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";

// Check if a user has discovered a feature
export async function hasDiscoveredFeature(userId: string, featureKey: string) {
  if (!userId) return false;

  const discovery = await db.query.feature_discoveries.findFirst({
    where: and(
      eq(feature_discoveries.user_id, userId),
      eq(feature_discoveries.feature_key, featureKey),
    ),
  });

  return !!discovery;
}

// Get all discovered features for a user
export async function getUserDiscoveredFeatures(userId: string) {
  if (!userId) return [];

  const discoveries = await db.query.feature_discoveries.findMany({
    where: eq(feature_discoveries.user_id, userId),
  });

  return discoveries.map((d) => d.feature_key);
}
