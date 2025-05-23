import dynamic from "next/dynamic";
import { Metadata } from "next";
import { headers } from "next/headers";
import PlayHeader from "./PlayHeader";

const Games = dynamic(() => import("./Games"), { ssr: false });

const BASE_URL =
  process.env.NEXT_PUBLIC_DEPLOYMENT_URL || process.env.VERCEL_URL;
const domain = BASE_URL ? `https://${BASE_URL}` : "http://localhost:3000";
const route = `${domain}/play`;
const frame = {
  version: "next",
  imageUrl: `${route}/opengraph-image`,
  button: {
    title: "Play",
    action: {
      type: "launch_frame",
      name: "idealite",
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
    title: "idealite play",
    openGraph: {
      title: "idealite play",
      description: "idealite play",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default async function PlayPage() {
  const headersList = headers();
  const userAgent = headersList.get("user-agent");
  const isWarpcast = userAgent?.toLowerCase().includes("warpcast");
  return (
    <div>
      <PlayHeader />
      <Games isWarpcast={isWarpcast ?? false} />
    </div>
  );
}
