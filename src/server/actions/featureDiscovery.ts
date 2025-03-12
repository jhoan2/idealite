"use server";

import { db } from "~/server/db";
import { feature_discoveries } from "~/server/db/schema";
import { hasDiscoveredFeature } from "../queries/featureDiscovery";

// Mark a feature as discovered
export async function markFeatureDiscovered(
  userId: string,
  featureKey: string,
) {
  if (!userId) return { success: false };

  try {
    // Check if already discovered to avoid duplicates
    const existing = await hasDiscoveredFeature(userId, featureKey);

    if (!existing) {
      await db.insert(feature_discoveries).values({
        user_id: userId,
        feature_key: featureKey,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error marking feature as discovered:", error);
    return { success: false, error };
  }
}
