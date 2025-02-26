"use client";

import { sdk } from "@farcaster/frame-sdk";
import { useEffect, useState } from "react";
import TwoTruths from "./TwoTruths";
export default function TwoTruthsFrame() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

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
    <div className="flex min-h-screen flex-col items-center justify-center">
      <TwoTruths />
    </div>
  );
}
