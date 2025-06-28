// app/mobile-canvas/MobileCanvas.tsx
"use client";

import { useEffect } from "react";
import { Tldraw, TLUiOverrides } from "tldraw";
import "tldraw/tldraw.css";

export default function MobileCanvas({ pageId }: { pageId: string }) {
  useEffect(() => {
    // Listen for messages from React Native
    const handleMessage = (event: MessageEvent) => {
      console.log("Message from RN:", event.data);
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleImageUpload = () => {
    // this will only exist inside the RN WebView
    window.ReactNativeWebView?.postMessage(
      JSON.stringify({ type: "OPEN_IMAGE_TOOLS" }),
    );
  };

  const overrides: TLUiOverrides = {
    tools: (editor, tools) => {
      // Override the existing asset tool (image tool)
      return {
        ...tools,
        asset: {
          id: "asset",
          label: tools.asset?.label || "Asset",
          icon: tools.asset?.icon || "image",
          kbd: tools.asset?.kbd || "",
          onSelect: () => {
            handleImageUpload();
            // Switch back to select tool to prevent default file picker
            editor.setCurrentTool("select");
          },
        },
      };
    },
  };
  return (
    <div className="relative h-full w-full">
      <Tldraw
        forceMobile={true}
        options={{ maxPages: 1 }}
        overrides={overrides}
      />
    </div>
  );
}
