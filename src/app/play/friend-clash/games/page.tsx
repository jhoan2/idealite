import PleaseLogin from "~/app/PleaseLogin";
import { getUserGameSessions } from "~/server/queries/gameSession";
import SessionsList from "./SessionsList";
import { currentUser } from "@clerk/nextjs/server";

export default async function FriendClashJoin() {
  const user = await currentUser();
  const userId = user?.externalId;

  if (!userId) {
    return <PleaseLogin />;
  }

  // const gameSessions = await getUserGameSessions(userId, "friend-clash");
  // if (!gameSessions.success) {
  //   return <div>Error: {gameSessions.error}</div>;
  // }

  // return <SessionsList sessions={gameSessions.data} game_type="friend-clash" />;
  return <div>Friend Clash Games</div>;
}
