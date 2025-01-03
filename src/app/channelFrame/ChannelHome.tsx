"use client";

import { useEffect, useState } from "react";
import sdk from "@farcaster/frame-sdk";
import { useSession } from "next-auth/react";
import Image from "next/image";
import SignInWithFarcaster from "./SignInWithFarcaster";
import { Button } from "~/components/ui/button";
import ChannelFrameTags from "./ChannelFrameTags";
import { toast } from "sonner";

export default function ChannelHome() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    const load = async () => {
      sdk.actions.ready();
    };
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

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
            <SignInWithFarcaster status={status} />
            <Button onClick={handleJoinChannel}>Join Channel</Button>
          </div>
        </div>
      </nav>
      <ChannelFrameTags />
    </>
  );
}
