"use client";
import { NeynarAuthButton } from "@neynar/react";
import { sdk } from "@farcaster/frame-sdk";
import { useEffect, useState } from "react";

export default function MobileSignIn({ isWarpcast }: { isWarpcast: boolean }) {
  useEffect(() => {
    const load = async () => {
      const result = await sdk.actions.ready();
    };
    load();
  }, []);

  if (isWarpcast) {
    return null;
  }

  return (
    <div>
      <NeynarAuthButton />
    </div>
  );
}
