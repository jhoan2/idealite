"use client";

import { Tldraw, TLComponents } from "tldraw";
import "tldraw/tldraw.css";
import { CustomStylePanel } from "./CustomStylePanel";

export default function CanvasEditor({
  title,
  content,
  pageId,
}: {
  title: string;
  content: any;
  pageId: string;
}) {
  const components: TLComponents = {
    StylePanel: CustomStylePanel,
  };

  return (
    <div className="relative flex h-[100dvh] max-h-[85dvh] w-full overflow-hidden">
      <Tldraw components={components} options={{ maxPages: 1 }} />
    </div>
  );
}
