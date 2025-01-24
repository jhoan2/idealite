import dynamic from "next/dynamic";
import { Metadata } from "next";
import { auth } from "~/app/auth";
import { getTagWithChildren } from "~/server/queries/tag";
import { getUserTags } from "~/server/queries/usersTags";
import { checkIfMember } from "~/server/farcaster";

const ChannelHome = dynamic(() => import("./ChannelHome"), { ssr: false });

const BASE_URL =
  process.env.NEXT_PUBLIC_DEPLOYMENT_URL || process.env.VERCEL_URL;
const domain = BASE_URL ? `https://${BASE_URL}` : "http://localhost:3000";
const route = `${domain}/channelFrame`;
const frame = {
  version: "next",
  imageUrl: `${route}/opengraph-image`,
  button: {
    title: "Become a member",
    action: {
      type: "launch_frame",
      name: "idealite",
      url: route,
      splashImageUrl:
        "https://gateway.pinata.cloud/ipfs/bafkreidlqpger2bsx56loncfxllrhx3y3msugosybbd5gjqudmirehs7xy",
      splashBackgroundColor: "#f7f7f7",
    },
  },
};

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "idealite",
    openGraph: {
      title: "idealite",
      description: "idealite channel frame",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default async function Page() {
  const session = await auth();
  const userId = session?.user?.id;
  const userFid = session?.user?.fid;
  const tag = await getTagWithChildren(
    process.env.NEXT_PUBLIC_ROOT_TAG_ID ?? "",
  );
  const userTags = userId ? await getUserTags(userId) : [];
  const isMember = userFid ? await checkIfMember(userFid.toString()) : false;
  return (
    <ChannelHome
      session={session}
      tag={tag}
      userTags={userTags}
      userId={userId ?? null}
      isMember={isMember}
    />
  );
}
