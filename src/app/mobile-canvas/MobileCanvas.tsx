// app/mobile-canvas/MobileCanvas.tsx
"use client";

import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

export default function MobileCanvas({ pageId }: { pageId: string }) {
  return (
    <div className="h-full w-full">
      <Tldraw forceMobile={true} options={{ maxPages: 1 }} />
    </div>
  );
}
