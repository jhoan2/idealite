"use client";

import { useEffect, useState } from "react";
import sdk from "@farcaster/frame-sdk";
import { useSession } from "next-auth/react";
import Image from "next/image";
import SignInWithFarcaster from "./SignInWithFarcaster";

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

  return (
    <nav className="border-b">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-2">
          <Image src="/icon48.png" alt="idealite logo" width={32} height={32} />
          <h1 className="text-xl font-semibold text-amber-400">Idealite</h1>
        </div>
        <div className="flex">
          <SignInWithFarcaster status={status} />
        </div>
      </div>
    </nav>
  );
}
