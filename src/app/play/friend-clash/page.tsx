import dynamic from "next/dynamic";
import { Metadata } from "next";
import PleaseLogin from "~/app/PleaseLogin";
import { currentUser } from "@clerk/nextjs/server";

const FriendClashFrame = dynamic(() => import("./FriendClashFrame"), {
  ssr: false,
});

const BASE_URL =
  process.env.NEXT_PUBLIC_DEPLOYMENT_URL || process.env.VERCEL_URL;
const domain = BASE_URL ? `https://${BASE_URL}` : "http://localhost:3000";
const route = `${domain}/play/friend-clash`;
const frame = {
  version: "next",
  imageUrl: `${route}/opengraph-image`,
  button: {
    title: "Friend Clash",
    action: {
      type: "launch_frame",
      name: "friend_clash",
      url: route,
      splashImageUrl:
        "https://purple-defensive-anglerfish-674.mypinata.cloud/ipfs/bafkreidlqpger2bsx56loncfxllrhx3y3msugosybbd5gjqudmirehs7xy",
      splashBackgroundColor: "#f7f7f7",
    },
  },
};

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Friend Clash",
    openGraph: {
      title: "Friend Clash",
      description: "Friend Clash",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default async function FriendClashPage() {
  const user = await currentUser();
  const userId = user?.externalId;
  if (!userId) {
    return <PleaseLogin />;
  }

  return <FriendClashFrame />;
}
