"use client";

import { useState, useEffect } from "react";
import { sdk } from "@farcaster/frame-sdk";

export default function ClashGameFrame() {
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
  return <div>ClashGameFrame</div>;
}
