import { auth } from "~/app/auth";
import PleaseLogin from "~/app/PleaseLogin";
import { getUserGameSessions } from "~/server/queries/gameSession";
import SessionsList from "../../friend-clash/games/SessionsList";

export default async function SpinTheWheelJoin() {
  const session = await auth();

  if (!session?.user?.id) {
    return <PleaseLogin />;
  }

  const gameSessions = await getUserGameSessions(
    session.user.username,
    "spin-wheel",
  );
  if (!gameSessions.success) {
    return <div>Error: {gameSessions.error}</div>;
  }

  return <SessionsList sessions={gameSessions.data} game_type="spin-wheel" />;
}
