"use client";

import { useEffect, useState } from "react";
import sdk, { FrameNotificationDetails } from "@farcaster/frame-sdk";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import { SelectTag } from "~/server/queries/tag";
import posthog from "posthog-js";
import { Session } from "next-auth";
import Onboarding from "./Onboarding";
import { TreeTag } from "~/server/queries/usersTags";
import TagTreeNav from "../workspace/(TagTreeNav)/TagTreeNav";
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
  userTagTree,
  userId,
  isMember,
}: ExploreStateProps) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const { data: session, status } = useSession();
  const [isOnboarding, setIsOnboarding] = useState(
    !session || userTags.length === 0,
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="mr-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </Button>
          </div>
          <div className="flex space-x-2">
            {!isMember && status === "authenticated" && (
              <Button onClick={handleJoinChannel}>Join Channel</Button>
            )}
          </div>
        </div>
      </nav>
      {/* Add this new sidebar section */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-background transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex-1 overflow-y-auto">
            <TagTreeNav
              userTagTree={userTagTree}
              userId={userId ?? ""}
              isChannelView={true}
            />
          </div>
        </div>
      </div>

      {/* Add this overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
}
