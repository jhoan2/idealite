import { auth } from "~/app/auth";
import { getUserPlayStats } from "~/server/queries/user";
import { trackEvent } from "~/lib/posthog/server";
import dynamic from "next/dynamic";
import { Metadata } from "next";
import PleaseLogin from "~/app/PleaseLogin";

const GuessPictureFrame = dynamic(() => import("./GuessPictureFrame"), {
  ssr: false,
});

const BASE_URL =
  process.env.NEXT_PUBLIC_DEPLOYMENT_URL || process.env.VERCEL_URL;
const domain = BASE_URL ? `https://${BASE_URL}` : "http://localhost:3000";
const route = `${domain}/play/guess-the-picture`;
const frame = {
  version: "next",
  imageUrl: `${route}/opengraph-image`,
  button: {
    title: "Guess the Picture",
    action: {
      type: "launch_frame",
      name: "guess_the_picture",
      url: route,
      splashImageUrl:
        "https://purple-defensive-anglerfish-674.mypinata.cloud/ipfs/bafkreifdezavmxibncayirucjrv3q6ibe2eu7webiio6536l6rnybcatee",
      splashBackgroundColor: "#f7f7f7",
    },
  },
};

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Guess the Picture",
    openGraph: {
      title: "Guess the Picture",
      description: "idealite guess the picture game",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default async function GuessThePicturePage() {
  const session = await auth();
  if (!session?.user?.id) {
    return <PleaseLogin />;
  }

  trackEvent(session.user.fid, "guess_the_picture_page_viewed", {
    username: session.user.username,
  });

  return <GuessPictureFrame />;
}
