import { auth } from "~/app/auth";
import { getUserPlayStats } from "~/server/queries/user";
import { trackEvent } from "~/lib/posthog/server";
import dynamic from "next/dynamic";
import { Metadata } from "next";
import PleaseLogin from "~/app/PleaseLogin";

const SpinWheelFrame = dynamic(() => import("./SpinWheelFrame"), {
  ssr: false,
});

const BASE_URL =
  process.env.NEXT_PUBLIC_DEPLOYMENT_URL || process.env.VERCEL_URL;
const domain = BASE_URL ? `https://${BASE_URL}` : "http://localhost:3000";
const route = `${domain}/play/spin-wheel`;
const frame = {
  version: "next",
  imageUrl: `${route}/opengraph-image`,
  button: {
    title: "Spin Wheel",
    action: {
      type: "launch_frame",
      name: "spin_wheel",
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
    title: "Spin Wheel",
    openGraph: {
      title: "Spin Wheel",
      description: "idealite spin wheel game",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default async function SpinWheelPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return <PleaseLogin />;
  }

  trackEvent(session.user.fid, "spin_wheel_page_viewed", {
    username: session.user.username,
  });

  return <SpinWheelFrame />;
}
