import { db } from "~/server/db";
import { tabs } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export type Tab = typeof tabs.$inferSelect;

export async function getTabs(userId: string) {
  try {
    const userTabs = await db.query.tabs.findMany({
      where: eq(tabs.user_id, userId),
      orderBy: tabs.position,
    });

    return { success: true, data: userTabs };
  } catch (error) {
    console.error("Error fetching tabs:", error);
    return { success: false, error: "Failed to fetch tabs" };
  }
}
