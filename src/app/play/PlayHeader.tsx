import { currentUser } from "@clerk/nextjs/server";
import { getUserPlayStats } from "~/server/queries/user";

export default async function PlayHeader() {
  const user = await currentUser();
  const userId = user?.externalId;

  if (!userId) {
    return null;
  }

  const userPlayStats = await getUserPlayStats(userId);

  return (
    <div className="flex items-center justify-between p-6">
      <h2 className="text-2xl font-semibold">Play</h2>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 font-semibold">
          <img
            src="/points/Premium 2nd Outline 64px.png"
            alt="points"
            className="h-8 w-8"
          />
          <span>{userPlayStats.points} </span>
        </div>

        <div className="flex items-center gap-2 font-semibold">
          <img
            src="/cash/Blue Cash 1st Outline 64px.png"
            alt="cash"
            className="h-8 w-8"
          />
          <span>{userPlayStats.cash}</span>
        </div>
      </div>
    </div>
  );
}
