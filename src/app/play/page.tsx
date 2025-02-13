import { getUserPlayStats } from "~/server/queries/user";
import Games from "./Games";
import { auth } from "../auth";

export default async function PlayPage() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  const userPlayStats = await getUserPlayStats(session.user.id);
  return <Games userPlayStats={userPlayStats} />;
}
