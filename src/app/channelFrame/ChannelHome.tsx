"use client";

import { useEffect, useState } from "react";
import sdk, { FrameNotificationDetails } from "@farcaster/frame-sdk";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import ChannelFrameTags from "./ChannelFrameTags";
import { toast } from "sonner";
import { SelectTag } from "~/server/queries/tag";
import posthog from "posthog-js";
import { Session } from "next-auth";
import Onboarding from "./Onboarding";

interface ExploreStateProps {
  tag: SelectTag[];
  userTags: SelectTag[];
  userId: string | null;
  isMember: boolean;
  session: Session | null;
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
  isMember,
}: ExploreStateProps) {
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
      const frameContext = await sdk.context;
      sdk.actions.ready();
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
  }, [isSDKLoaded]);

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  if (!isOnboarding && (!session || userTags.length === 0)) {
    setIsOnboarding(true);
  }

  if (isOnboarding) {
    return (
      <Onboarding
        tag={tag}
        userTags={userTags}
        userId={userId}
        onComplete={() => setIsOnboarding(false)}
      />
    );
  }

  return (
    <>
      <nav className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2">
            <Image
              src="/icon48.png"
              alt="idealite logo"
              width={32}
              height={32}
            />
            <h1 className="text-xl font-semibold text-amber-400">Idealite</h1>
          </div>
          <div className="flex space-x-2">
            {!isMember && status === "authenticated" && (
              <Button onClick={handleJoinChannel}>Join Channel</Button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
