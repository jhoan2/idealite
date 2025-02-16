"use client";
import { NeynarAuthButton } from "@neynar/react";
import { sdk } from "@farcaster/frame-sdk";
import { useEffect, useState } from "react";

export default function MobileSignIn() {
  const [isInFrame, setIsInFrame] = useState(false);
  useEffect(() => {
    const load = async () => {
      const result = await sdk.actions.ready();
      setIsInFrame(result !== undefined);
    };
    load();
  }, []);

  if (!isInFrame) {
    return null;
  }

  return (
    <div>
      <NeynarAuthButton />
    </div>
  );
}
