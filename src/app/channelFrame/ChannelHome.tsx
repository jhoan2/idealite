"use client";

import { useEffect, useState } from "react";
import sdk, { FrameNotificationDetails } from "@farcaster/frame-sdk";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { SelectTag } from "~/server/queries/tag";
import posthog from "posthog-js";
import { Session } from "next-auth";
import Onboarding from "./Onboarding";
import { TreeTag } from "~/server/queries/usersTags";
import { useRouter } from "next/navigation";

interface ExploreStateProps {
  tag: SelectTag[];
  userTags: SelectTag[];
  userId: string | null;
  isMember: boolean;
  session: Session | null;
  userTagTree: TreeTag[];
}

export type SafeAreaInsets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export type FrameContext = {
  user: {
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  };
  // @ts-ignore
  location?: FrameLocationContext;
  client: {
    clientFid: number;
    added: boolean;
    safeAreaInsets?: SafeAreaInsets;
    notificationDetails?: FrameNotificationDetails;
  };
};

export default function ChannelHome({
  tag,
  userTags,
  userId,
}: ExploreStateProps) {
  const router = useRouter();
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const { data: session, status } = useSession();
  const [isOnboarding, setIsOnboarding] = useState(
    !session || userTags.length === 0,
  );

  const handleJoinChannel = async () => {
    const response = await fetch("/api/channelMembership", {
      method: "POST",
      body: JSON.stringify({ fid: session?.user?.fid }),
    });
    const data = await response.json();
    if (data.error) {
      toast.error(data.error);
    } else {
      toast.success("You are now a member of the channel");
    }
  };

  useEffect(() => {
    const load = async () => {
      sdk.actions.ready();
      const frameContext = await sdk.context;
      posthog.capture("channel_home_viewed", {
        distinctId: frameContext?.user?.fid,
        displayName: frameContext?.user?.displayName,
        username: frameContext?.user?.username,
      });
    };

    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }

    if (isSDKLoaded && status !== "loading" && session && userTags.length > 0) {
      router.push("/workspace");
    }
  }, [isSDKLoaded, status, session, userTags.length, router]);

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  if (!session || userTags.length === 0) {
    return (
      <Onboarding
        tag={tag}
        userTags={userTags}
        userId={userId}
        onComplete={() => router.push("/workspace")}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <img
        src="/idealite-loading-logo.gif"
        alt="Loading"
        width={200}
        height={200}
      />
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  );
}
