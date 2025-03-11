import Link from "next/link";
import { auth } from "../auth";
import { getUserPlayStats } from "~/server/queries/user";
import Games from "./Games";
import { headers } from "next/headers";

export default async function PlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const headersList = headers();
  const userAgent = headersList.get("user-agent");
  const isWarpcast = userAgent?.toLowerCase().includes("warpcast");

  if (!session?.user?.id) {
    return <Games isWarpcast={isWarpcast ?? false} />;
  }
  const userPlayStats = await getUserPlayStats(session.user.id);

  return (
    <div className="flex h-screen flex-col">
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
      <div className="flex border-b border-gray-700">
        <Link
          href="/play"
          className="flex-1 py-3 text-center font-medium text-gray-400"
        >
          Games
        </Link>
        <Link
          href="/play/leaderboard"
          className="flex-1 py-3 text-center font-medium text-gray-400"
        >
          Leaderboard
        </Link>
        {/* <Link
          href="/play/shop"
          className="flex-1 py-3 text-center font-medium text-gray-400"
        >
          Shop
        </Link> */}
      </div>
      {children}
    </div>
  );
}
