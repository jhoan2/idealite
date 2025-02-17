"use client";
import { useEffect, useState } from "react";
import sdk from "@farcaster/frame-sdk";
import WarpcastLogin from "./WarpcastLogin";

export default function WarpcastReady() {
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

  return <WarpcastLogin />;
}
