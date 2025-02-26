import { auth } from "~/app/auth";
import PleaseLogin from "~/app/PleaseLogin";

export default async function SpinTheWheelGamePage({
  params,
}: {
  params: { gameId: string };
}) {
  const session = await auth();

  if (!session?.user?.id) {
    return <PleaseLogin />;
  }

  return <div>SpinTheWheelGamePage</div>;
}
