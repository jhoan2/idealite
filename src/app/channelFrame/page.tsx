import dynamic from "next/dynamic";
import { Metadata } from "next";
import { auth } from "~/app/auth";
import { getTagWithChildren } from "~/server/queries/tag";
import { getUserTags } from "~/server/queries/usersTags";
import { checkIfMember } from "~/server/farcaster";

const ChannelHome = dynamic(() => import("./ChannelHome"), { ssr: false });
const BASE_URL = process.env.DEPLOYMENT_URL || process.env.VERCEL_URL;
const domain = BASE_URL ? `https://${BASE_URL}` : "http://localhost:3000";
const route = `${domain}/framesV2`;
const frame = {
  version: "next",
  imageUrl: `${route}/opengraph-image`,
  button: {
    title: "idealite",
    action: {
      type: "launch_frame",
      name: "idealite",
      url: route,
      splashImageUrl: `${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/bafkreiablfjyp7felottl6c2wpnspib7ww2ynnyuwxkodqwsq7pvyjo5ge`,
      splashBackgroundColor: "#f5f0ec",
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
      tag={tag}
      userTags={userTags}
      userId={userId ?? null}
      isMember={isMember}
    />
  );
}
