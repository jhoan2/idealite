"use client";

import { Tldraw, TLComponents } from "tldraw";
import "tldraw/tldraw.css";

export default function CanvasEditor() {
  const components: TLComponents = {};

  return (
    <div className="relative flex h-[100dvh] max-h-[85dvh] w-full overflow-hidden">
      <Tldraw components={components} options={{ maxPages: 1 }} />
    </div>
  );
}
