import dynamic from "next/dynamic";
import { Metadata } from "next";
import PleaseLogin from "~/app/PleaseLogin";
import { currentUser } from "@clerk/nextjs/server";
import { trackEvent } from "~/lib/posthog/server";
import {
  GameSessionWithMoves,
  getGameSession,
} from "~/server/queries/gameSession";
const ClashGameFrame = dynamic(() => import("./ClashGameFrame"), {
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
  const route = `${domain}/play/friend-clash/${params.gameId}`;

  const frame = {
    version: "next",
    imageUrl: `${route}/opengraph-image`,
    button: {
      title: "Join Game",
      action: {
        type: "launch_frame",
        name: "friend_clash_game",
        url: route,
        splashImageUrl:
          "https://purple-defensive-anglerfish-674.mypinata.cloud/ipfs/bafkreidlqpger2bsx56loncfxllrhx3y3msugosybbd5gjqudmirehs7xy",
        splashBackgroundColor: "#f7f7f7",
      },
    },
  };

  return {
    title: "Friend Clash Game",
    openGraph: {
      title: "Friend Clash Game",
      description: "Join the Friend Clash game!",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default async function FriendClashPage({
  params,
}: {
  params: { gameId: string };
}) {
  const user = await currentUser();
  const userId = user?.externalId;
  if (!userId) {
    return <PleaseLogin />;
  }

  const response = await getGameSession(params.gameId);

  if (!response.success) {
    throw new Error(response.error);
  }

  const gameSession = response.data;

  // return (
  //   <ClashGameFrame
  //     gameSession={gameSession as GameSessionWithMoves}
  //     currentUsername={session.user.username}
  //   />
  // );
  return <div>Friend Clash Game</div>;
}
