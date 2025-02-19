import { createClozeCards } from "~/server/actions/card";
import { getUserPlayStats } from "~/server/queries/user";
import { auth } from "~/app/auth";
import dynamic from "next/dynamic";
import { Metadata } from "next";
import { trackEvent } from "~/lib/posthog/server";
import PleaseLogin from "~/app/PleaseLogin";

const ClozeFrame = dynamic(() => import("./ClozeFrame"), {
  ssr: false,
});

const BASE_URL =
  process.env.NEXT_PUBLIC_DEPLOYMENT_URL || process.env.VERCEL_URL;
const domain = BASE_URL ? `https://${BASE_URL}` : "http://localhost:3000";
const route = `${domain}/play/cloze`;
const frame = {
  version: "next",
  imageUrl: `${route}/opengraph-image`,
  button: {
    title: "Fill in the blank",
    action: {
      type: "launch_frame",
      name: "fill_in_the_blank",
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
    title: "Fill in the blank",
    openGraph: {
      title: "Fill in the blank",
      description: "idealite fill in the blank game",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default async function ClozePage() {
  const session = await auth();
  if (!session?.user?.id) {
    return <PleaseLogin />;
  }

  trackEvent(session.user.fid, "cloze_page_viewed", {
    username: session.user.username,
  });

  const userPlayStats = await getUserPlayStats(session.user.id);
  const flashcards = await createClozeCards();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <ClozeFrame flashcards={flashcards} userPlayStats={userPlayStats} />
    </div>
  );
}
