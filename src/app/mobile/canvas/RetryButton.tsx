// app/mobile/canvas/RetryButton.tsx
"use client";

import React from "react";
import { Button } from "~/components/ui/button";
export function RetryButton() {
  const handleRetry = () => {
    // send a “RETRY” signal up to RN
    window.ReactNativeWebView?.postMessage(JSON.stringify({ type: "RETRY" }));
  };

  return (
    <button
      onClick={handleRetry}
      className="inline-block rounded bg-blue-500 px-4 py-2 text-white"
    >
      🔄 Retry
    </button>
  );
}
