// app/mobile/global-tags/MobileCirclePack.tsx
"use client";

import { useState, useCallback } from "react";
import { stopEventPropagation, Tldraw } from "tldraw";
import "tldraw/tldraw.css";
import { hierarchy, pack } from "d3-hierarchy";
import { scaleOrdinal } from "d3-scale";
import * as Sentry from "@sentry/nextjs";

interface TreeNodeData {
  id: string;
  name: string;
  children?: TreeNodeData[];
  isInBoth?: boolean;
}

interface MobileCirclePackProps {
  width?: number;
  height?: number;
  tagTree: TreeNodeData | undefined;
}

function CircleVisualization({
  width = 600,
  height = 600,
  tagTree,
}: MobileCirclePackProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const data: TreeNodeData = tagTree || {
    id: "root",
    name: "Root",
    children: [],
  };

  // Helper: read __session token from document.cookie (same as Canvas)
  const getAuthToken = () => {
    const match = document.cookie.match(/__session=([^;]+)/);
    return match ? match[1] : "";
  };

  // Exact same colors as web version
  const colors = [
    "#FAAC7D",
    "#FAC552",
    "#FAAF53",
    "#FA7452",
    "#EBD050",
    "#EB7450",
    "#EAAA50",
    "#EBBD50",
    "#EB8F50",
    "#EBCB9E",
    "#EB6554",
    "#EB9954",
    "#EB7F55",
    "#EBB154",
    "#EB6A2F",
  ];

  // Exact same arc functions as web version
  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number,
  ) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const describeArc = (
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
  ) => {
    const start = polarToCartesian(x, y, radius, startAngle);
    const end = polarToCartesian(x, y, radius, endAngle);
    const arcLength = endAngle - startAngle;
    const longArc = arcLength >= 180 ? 1 : 0;
    const d = [
      "M",
      start.x,
      start.y,
      "A",
      radius,
      radius,
      0,
      longArc,
      1,
      end.x,
      end.y,
    ].join(" ");
    return d;
  };

  // Updated click handler using the same auth pattern as Canvas
  const handleCircleClick = useCallback(
    async (
      event: React.MouseEvent | React.TouchEvent,
      node: d3.HierarchyCircularNode<TreeNodeData>,
    ) => {
      event.stopPropagation();

      // Skip if already added
      if (node.data.isInBoth) {
        return;
      }

      setIsLoading(true);
      setMessage(null);

      try {
        // Use the same auth pattern as Canvas
        const token = getAuthToken();
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        // Add authorization header if token is available (same as Canvas)
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        // Call the V1 API route with the same pattern as Canvas
        const response = await fetch("/api/v1/users/tags/add", {
          method: "POST",
          headers,
          credentials: "include", // Include cookies for additional auth context (same as Canvas)
          body: JSON.stringify({
            tagId: node.data.id,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          // Send success message to React Native WebView
          if (typeof window !== "undefined" && window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({
                type: "TAG_ADDED_SUCCESS",
                tagId: node.data.id,
                tagName: node.data.name,
              }),
            );
          }
        } else {
          // Handle API error responses
          const errorMessage = result.error || "Failed to add tag";
          throw new Error(errorMessage);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to add tag";

        console.error("Error adding tag:", error);

        Sentry.captureException(error, {
          tags: {
            component: "MobileCirclePack",
            function: "handleCircleClick",
            api: "v1-users-tags-add",
            tagId: node.data.id,
            tagName: node.data.name,
          },
          extra: {
            errorMessage,
            nodeData: {
              id: node.data.id,
              name: node.data.name,
              isInBoth: node.data.isInBoth,
            },
          },
        });

        // Send error message to React Native WebView
        if (typeof window !== "undefined" && window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: "TAG_ADD_ERROR",
              error: errorMessage,
            }),
          );
        }

        setMessage({ type: "error", text: errorMessage });
        setTimeout(() => setMessage(null), 3000);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Same hierarchy setup as web version
  const hierarchyData = hierarchy(data)
    .sum(() => 1)
    .sort((a, b) => b.value! - a.value!);

  // Same pack generator as web version
  const packGenerator = pack<TreeNodeData>().size([width, height]).padding(15);

  const root = packGenerator(hierarchyData);

  // Exact same color scale as web version
  const firstLevelGroups = hierarchyData?.children?.map(
    (child) => child.data.name,
  );
  const colorScale = scaleOrdinal<string>()
    .domain(firstLevelGroups || [])
    .range(colors);

  // Send haptic feedback to React Native
  const sendHapticFeedback = (type: "impact" | "selection") => {
    if (typeof window !== "undefined" && window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: type === "impact" ? "HAPTIC_IMPACT" : "HAPTIC_SELECTION",
        }),
      );
    }
  };

  // Very similar renderCircles to web version, with mobile touch events
  const renderCircles = (nodes: d3.HierarchyCircularNode<TreeNodeData>[]) => {
    return nodes.map((node) => {
      const parentName = node.data.name;
      const arcText = describeArc(node.x, node.y, node.r - 10, -10, 270);

      return (
        <g
          key={node.data.id}
          onClick={
            node.data.isInBoth
              ? undefined
              : (event) => {
                  sendHapticFeedback("impact");
                  handleCircleClick(event, node);
                }
          }
          onTouchStart={
            node.data.isInBoth
              ? undefined
              : (event) => {
                  sendHapticFeedback("selection");
                  handleCircleClick(event, node);
                }
          }
          onPointerDown={stopEventPropagation}
          style={{ cursor: node.data.isInBoth ? "default" : "pointer" }}
        >
          <circle
            cx={node.x}
            cy={node.y}
            r={node.r}
            stroke={colorScale(parentName)}
            strokeWidth={node.data.isInBoth ? 3 : 1}
            strokeOpacity={0.8}
            fill={colorScale(parentName)}
            fillOpacity={node.data.isInBoth ? 0.8 : 0.1}
            className={
              node.data.isInBoth
                ? ""
                : "active:fill-opacity-30 transition-colors duration-200 hover:fill-slate-400"
            }
          />
          {/* Same text rendering as web */}
          <path id={`arc-${node.data.id}`} fill="none" d={arcText} />
          <text fontSize={12} fontWeight={400}>
            <textPath href={`#arc-${node.data.id}`}>{node.data.name}</textPath>
          </text>
        </g>
      );
    });
  };

  // Same depth rendering as web version
  const getNodesAtDepth = (depth: number) => {
    return root.descendants().filter((node) => node.depth === depth);
  };

  const maxDepth = Math.max(...root.descendants().map((node) => node.depth));
  const allCircles = Array.from({ length: maxDepth + 1 }, (_, i) =>
    renderCircles(getNodesAtDepth(i)),
  );

  return (
    <div className="relative">
      {/* Message overlay */}
      {message && (
        <div
          className={`absolute left-4 right-4 top-20 z-50 rounded-lg p-3 shadow-lg ${
            message.type === "success"
              ? "border border-green-200 bg-green-50 text-green-800"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}
          onPointerDown={stopEventPropagation}
          onPointerMove={stopEventPropagation}
          style={{ userSelect: "none" }}
        >
          <p className="text-center text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-gray-50/50"
          onPointerDown={stopEventPropagation}
          onPointerMove={stopEventPropagation}
        >
          <div className="rounded-lg bg-white p-4 shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
              <span className="text-sm font-medium text-gray-900">
                Adding tag...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Same SVG structure as web version */}
      <svg width={width} height={height} style={{ display: "inline-block" }}>
        {allCircles}
      </svg>
    </div>
  );
}

// Tldraw wrapper - same structure as web version
export default function MobileCirclePack({
  tagTree,
}: {
  tagTree: TreeNodeData | undefined;
}) {
  const components = {
    OnTheCanvas: (props: any) => (
      <CircleVisualization {...props} tagTree={tagTree} />
    ),
  };

  return (
    <div className="tldraw__editor h-full">
      <Tldraw
        persistenceKey="mobile-global-tags-canvas"
        components={components}
        hideUi={true}
        options={{
          maxPages: 1,
        }}
      />
    </div>
  );
}
