import WarpcastLogin from "~/app/WarpcastLogin";
import { auth } from "~/app/auth";
import { getUserGameSessions } from "~/server/queries/gameSession";
import SessionsList from "./SessionsList";

export default async function FriendClashJoin() {
  const session = await auth();
  if (!session?.user?.id) {
    return <WarpcastLogin />;
  }

  const gameSessions = await getUserGameSessions(
    session.user.username,
    "friend-clash",
  );
  if (!gameSessions.success) {
    return <div>Error: {gameSessions.error}</div>;
  }

  return <SessionsList sessions={gameSessions.data} />;
}
