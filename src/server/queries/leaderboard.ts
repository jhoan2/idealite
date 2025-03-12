import { db } from "~/server/db";
import { users, points_history } from "~/server/db/schema";
import { sql, desc, eq } from "drizzle-orm";

export async function getWeeklyLeaderboard(limit: number = 50) {
  // Get current week's start date
  const currentWeekStart = new Date();
  currentWeekStart.setDate(
    currentWeekStart.getDate() - currentWeekStart.getDay(),
  ); // Go to Sunday
  currentWeekStart.setHours(0, 0, 0, 0); // Start of the day

  return db
    .select({
      userId: users.id,
      username: users.username,
      displayName: users.display_name,
      pfpUrl: users.pfp_url,
      avatarUrl: users.avatar_url,
      weeklyPoints: sql<number>`SUM(${points_history.points})`.as(
        "weekly_points",
      ),
      totalPoints: users.points,
    })
    .from(points_history)
    .innerJoin(users, eq(points_history.user_id, users.id))
    .where(eq(points_history.week_start, currentWeekStart))
    .groupBy(
      users.id,
      users.username,
      users.display_name,
      users.pfp_url,
      users.avatar_url,
      users.points,
    )
    .orderBy(desc(sql`weekly_points`))
    .limit(limit);
}

export async function getAllTimeLeaderboard(limit: number = 50) {
  return db
    .select({
      userId: users.id,
      username: users.username,
      displayName: users.display_name,
      pfpUrl: users.pfp_url,
      avatarUrl: users.avatar_url,
      totalPoints: users.points,
    })
    .from(users)
    .orderBy(desc(users.points))
    .limit(limit);
}
