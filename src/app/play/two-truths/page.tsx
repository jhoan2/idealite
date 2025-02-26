import { auth } from "~/app/auth";
import { getUserPlayStats } from "~/server/queries/user";
import { trackEvent } from "~/lib/posthog/server";
import dynamic from "next/dynamic";
import { Metadata } from "next";
import PleaseLogin from "~/app/PleaseLogin";

const TwoTruthsFrame = dynamic(() => import("./TwoTruthsFrame"), {
  ssr: false,
});

const BASE_URL =
  process.env.NEXT_PUBLIC_DEPLOYMENT_URL || process.env.VERCEL_URL;
const domain = BASE_URL ? `https://${BASE_URL}` : "http://localhost:3000";
const route = `${domain}/play/two-truths`;
const frame = {
  version: "next",
  imageUrl: `${route}/opengraph-image`,
  button: {
    title: "Two Truths and a Lie",
    action: {
      type: "launch_frame",
      name: "two_truths",
      url: route,
      splashImageUrl:
        "https://purple-defensive-anglerfish-674.mypinata.cloud/ipfs/bafkreifksrq64hydxsfve56bvoidvfgkvzxcq6kwyfhwkdapfyiscnlllm",
      splashBackgroundColor: "#f7f7f7",
    },
  },
};

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Two Truths and a Lie",
    openGraph: {
      title: "Two Truths and a Lie",
      description: "idealite two truths and a lie game",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default async function TwoTruthsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return <PleaseLogin />;
  }

  trackEvent(session.user.fid, "two_truths_page_viewed", {
    username: session.user.username,
  });

  return <TwoTruthsFrame />;
}
