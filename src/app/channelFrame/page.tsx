import dynamic from "next/dynamic";
import { Metadata } from "next";
import { auth } from "~/app/auth";
import { getTagWithChildren } from "~/server/queries/tag";
import { getUserTags, getUserTagTree } from "~/server/queries/usersTags";
import { checkIfMember } from "~/server/farcaster";
import { headers } from "next/headers";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import Image from "next/image";
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
        "https://purple-defensive-anglerfish-674.mypinata.cloud/ipfs/bafkreidlqpger2bsx56loncfxllrhx3y3msugosybbd5gjqudmirehs7xy",
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

function isDesktopDevice(userAgent: string | null): boolean {
  if (!userAgent) return true;

  return !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(
    userAgent,
  );
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
  const userTagTree = userId ? await getUserTagTree(userId) : [];
  const headersList = headers();
  const userAgent = headersList.get("user-agent");
  const isWarpcast = userAgent?.toLowerCase().includes("warpcast");
  const isDesktop = isDesktopDevice(userAgent);

  if (!isWarpcast || isDesktop) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1>Check out the website</h1>
        <Image
          src="/icon256.png"
          alt="idealite logo"
          width={100}
          height={100}
        />
        <Button>
          <Link href="https://idealite.xyz">idealite.xyz</Link>
        </Button>
      </div>
    );
  }

  return (
    <ChannelHome
      session={session}
      tag={tag}
      userTags={userTags}
      userId={userId ?? null}
      isMember={isMember}
      userTagTree={userTagTree}
    />
  );
}
