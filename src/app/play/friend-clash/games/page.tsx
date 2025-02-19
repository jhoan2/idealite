import { auth } from "~/app/auth";
import PleaseLogin from "~/app/PleaseLogin";
import { getUserGameSessions } from "~/server/queries/gameSession";
import SessionsList from "./SessionsList";

export default async function FriendClashJoin() {
  const session = await auth();

  if (!session?.user?.id) {
    return <PleaseLogin />;
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
