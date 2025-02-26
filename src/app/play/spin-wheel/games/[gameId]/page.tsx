import dynamic from "next/dynamic";
import { Metadata } from "next";
import { auth } from "~/app/auth";
import PleaseLogin from "~/app/PleaseLogin";
import { trackEvent } from "~/lib/posthog/server";
import {
  GameSessionWithMoves,
  getGameSession,
} from "~/server/queries/gameSession";
const SpinWheelFrame = dynamic(() => import("./SpinWheelFrame"), {
  ssr: false,
});

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: { gameId: string };
}): Promise<Metadata> {
  const BASE_URL =
    process.env.NEXT_PUBLIC_DEPLOYMENT_URL || process.env.VERCEL_URL;
  const domain = BASE_URL ? `https://${BASE_URL}` : "http://localhost:3000";
  const route = `${domain}/play/spin-wheel/${params.gameId}`;

  const frame = {
    version: "next",
    imageUrl: `${route}/opengraph-image`,
    button: {
      title: "Join Game",
      action: {
        type: "launch_frame",
        name: "spin_the_wheel_game",
        url: route,
        splashImageUrl:
          "https://purple-defensive-anglerfish-674.mypinata.cloud/ipfs/bafkreidlqpger2bsx56loncfxllrhx3y3msugosybbd5gjqudmirehs7xy",
        splashBackgroundColor: "#f7f7f7",
      },
    },
  };

  return {
    title: "Spin the Wheel Game",
    openGraph: {
      title: "Spin the Wheel Game",
      description: "Join the Spin the Wheel game!",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default async function SpinWheelPage({
  params,
}: {
  params: { gameId: string };
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return <PleaseLogin />;
  }

  const response = await getGameSession(params.gameId);

  if (!response.success) {
    throw new Error(response.error);
  }

  const gameSession = response.data;

  trackEvent(session.user.fid, "spin_the_wheel_game_viewed", {
    username: session.user.username,
  });

  return (
    <SpinWheelFrame
      gameSession={gameSession as GameSessionWithMoves}
      currentUsername={session.user.username}
    />
  );
}
