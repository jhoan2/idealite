"use client";

import { useEffect, useRef } from "react";
import {
  Tldraw,
  TLUiOverrides,
  useEditor,
  createShapeId,
  AssetRecordType,
} from "tldraw";
import "tldraw/tldraw.css";
import { toast } from "sonner";

export default function MobileCanvas({ pageId }: { pageId: string }) {
  const editorRef = useRef<ReturnType<typeof useEditor> | null>(null);

  // Message handler that creates TLDraw shapes from uploaded images
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === "IMAGE_UPLOADED") {
          if (!editorRef.current) {
            toast.error("Canvas not ready");
            return;
          }

          const editor = editorRef.current;

          try {
            // Create asset first
            const assetId = AssetRecordType.createId();

            const asset = {
              id: assetId,
              type: "image" as const,
              typeName: "asset" as const,
              props: {
                name: `mobile-image-${Date.now()}.jpg`,
                src: message.imageUrl,
                w: 300,
                h: 200,
                mimeType: "image/jpeg",
                isAnimated: false,
              },
              meta: {
                description: message.description || "",
                status: "uploaded",
                cloudflareKey: message.cloudflareKey || null,
              },
            };

            editor.createAssets([asset]);

            // Create image shape that references the asset
            const shapeId = createShapeId();

            // Get viewport center
            const viewportBounds = editor.getViewportPageBounds();
            const centerX = viewportBounds.center.x - 150;
            const centerY = viewportBounds.center.y - 100;

            const shape = {
              id: shapeId,
              type: "image" as const,
              x: centerX,
              y: centerY,
              props: {
                assetId: assetId,
                w: 300,
                h: 200,
              },
            };

            editor.createShape(shape);

            // Select and zoom to the new shape
            editor.select(shapeId);
            editor.zoomToSelection();

            // Notify React Native that image was successfully added
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(
                JSON.stringify({ type: "IMAGE_ADDED_SUCCESS" }),
              );
            }

            // Dispatch custom event for canvas tour tracking
            window.dispatchEvent(new CustomEvent("canvas-image-added"));
          } catch (shapeError) {
            console.error("Error creating asset/shape:", shapeError);
            toast.error("Failed to create shape");

            // Notify React Native about the error
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(
                JSON.stringify({
                  type: "IMAGE_ADD_ERROR",
                  error:
                    shapeError instanceof Error
                      ? shapeError.message
                      : "Unknown error",
                }),
              );
            }
          }
        }
      } catch (parseError) {
        console.error("Error parsing message:", parseError);
        toast.error("Failed to parse message");
      }
    };

    // Listen for messages from React Native (both iOS and Android)
    window.addEventListener("message", handleMessage);
    document.addEventListener("message", handleMessage as EventListener);

    return () => {
      window.removeEventListener("message", handleMessage);
      document.removeEventListener("message", handleMessage as EventListener);
    };
  }, []);

  const handleImageUpload = () => {
    // Send message to React Native to open image tools
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: "OPEN_IMAGE_TOOLS" }),
      );
    }
  };

  // Store editor reference when it becomes available
  const handleMount = (editor: ReturnType<typeof useEditor>) => {
    editorRef.current = editor;
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
        onMount={handleMount}
      />
    </div>
  );
}
