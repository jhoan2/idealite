import { auth } from "~/app/auth";
import {
  getWeeklyLeaderboard,
  getAllTimeLeaderboard,
} from "~/server/queries/leaderboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

export default async function LeaderboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const [weeklyLeaderboard, allTimeLeaderboard] = await Promise.all([
    getWeeklyLeaderboard(20),
    getAllTimeLeaderboard(20),
  ]);

  // Add rank to each player based on their position in the array
  const weeklyWithRanks = weeklyLeaderboard.map((player, index) => ({
    ...player,
    rank: index + 1,
  }));

  const allTimeWithRanks = allTimeLeaderboard.map((player, index) => ({
    ...player,
    rank: index + 1,
  }));

  // Find the current user's position in each leaderboard
  const currentUserWeeklyRank =
    weeklyWithRanks.findIndex((player) => player.userId === userId) + 1;
  const currentUserAllTimeRank =
    allTimeWithRanks.findIndex((player) => player.userId === userId) + 1;

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">
          See who's earned the most points this week and all time
        </p>
      </div>

      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="weekly">This Week</TabsTrigger>
          <TabsTrigger value="alltime">All Time</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-4">
          {weeklyWithRanks.length > 0 ? (
            weeklyWithRanks.map((player) => (
              <div
                key={player.userId}
                className="flex items-center justify-between rounded-lg bg-card/80 p-3 shadow-sm transition-colors hover:bg-card/90"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                      player.rank === 1
                        ? "bg-yellow-400 text-yellow-900"
                        : player.rank === 2
                          ? "bg-gray-300 text-gray-800"
                          : player.rank === 3
                            ? "bg-amber-600 text-amber-50"
                            : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {player.rank}
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-muted">
                    {player.pfpUrl || player.avatarUrl ? (
                      <img
                        src={player.pfpUrl || player.avatarUrl || ""}
                        alt={player.username || ""}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold">
                        {player.username?.slice(0, 2).toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <span className="font-medium">
                    {player.displayName || player.username || "Anonymous"}
                    {player.userId === userId && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (You)
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <img
                    src="/points/Premium 2nd Outline 64px.png"
                    alt="points"
                    className="h-6 w-6"
                  />
                  <span className="font-semibold">
                    {player.weeklyPoints?.toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center">
              <p className="text-muted-foreground">
                No points recorded this week yet
              </p>
              <p className="mt-2 text-sm">
                Play games to earn points and appear on the leaderboard!
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="alltime" className="space-y-4">
          {allTimeWithRanks.map((player) => (
            <div
              key={player.userId}
              className="flex items-center justify-between rounded-lg bg-card/80 p-3 shadow-sm transition-colors hover:bg-card/90"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                    player.rank === 1
                      ? "bg-yellow-400 text-yellow-900"
                      : player.rank === 2
                        ? "bg-gray-300 text-gray-800"
                        : player.rank === 3
                          ? "bg-amber-600 text-amber-50"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {player.rank}
                </div>
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-muted">
                  {player.pfpUrl || player.avatarUrl ? (
                    <img
                      src={player.pfpUrl || player.avatarUrl || ""}
                      alt={player.username || ""}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold">
                      {player.username?.slice(0, 2).toUpperCase() || "U"}
                    </span>
                  )}
                </div>
                <span className="font-medium">
                  {player.displayName || player.username || "Anonymous"}
                  {player.userId === userId && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (You)
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <img
                  src="/points/Premium 2nd Outline 64px.png"
                  alt="points"
                  className="h-6 w-6"
                />
                <span className="font-semibold">
                  {player.totalPoints.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {(currentUserWeeklyRank > 20 || currentUserAllTimeRank > 20) && (
        <div className="mt-8 rounded-lg border border-border p-4">
          <h3 className="mb-2 font-medium">Your Ranking</h3>
          <div className="flex flex-col gap-4 sm:flex-row">
            {currentUserWeeklyRank > 20 && (
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Weekly Rank</p>
                <p className="font-semibold">{currentUserWeeklyRank}</p>
              </div>
            )}
            {currentUserAllTimeRank > 20 && (
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">All-Time Rank</p>
                <p className="font-semibold">{currentUserAllTimeRank}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
