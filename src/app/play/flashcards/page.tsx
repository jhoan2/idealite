import { createQuestionAndAnswer } from "~/server/actions/card";
import { getUserPlayStats } from "~/server/queries/user";
import dynamic from "next/dynamic";
import { Metadata } from "next";
import PleaseLogin from "~/app/PleaseLogin";
import { currentUser } from "@clerk/nextjs/server";

const FlashcardFrame = dynamic(() => import("./FlashcardFrame"), {
  ssr: false,
});

const BASE_URL =
  process.env.NEXT_PUBLIC_DEPLOYMENT_URL || process.env.VERCEL_URL;
const domain = BASE_URL ? `https://${BASE_URL}` : "http://localhost:3000";
const route = `${domain}/play/flashcards`;
const frame = {
  version: "next",
  imageUrl: `${route}/opengraph-image`,
  button: {
    title: "Questions and Answers",
    action: {
      type: "launch_frame",
      name: "questions_and_answers",
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
    title: "Questions and Answers",
    openGraph: {
      title: "Questions and Answers",
      description: "Questions and Answers",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default async function FlashcardsPage() {
  const user = await currentUser();
  const userId = user?.externalId;
  if (!userId) {
    return <PleaseLogin />;
  }

  const flashcards = await createQuestionAndAnswer();
  const userPlayStats = await getUserPlayStats(userId);

  return (
    <FlashcardFrame flashcards={flashcards} userPlayStats={userPlayStats} />
  );
}
