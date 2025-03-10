"use client";

import {
  Tldraw,
  TLComponents,
  DefaultToolbar,
  DefaultToolbarContent,
  getSnapshot,
  useEditor,
  TLAssetStore,
  TLUiOverrides,
} from "tldraw";
import "tldraw/tldraw.css";
import { toast } from "sonner";
import { useCallback, useState, useRef } from "react";
import { SaveIcon } from "lucide-react";
import { ImageResponse } from "~/app/api/image/route";
import { saveCanvasData } from "~/server/actions/canvas";
import { debounce } from "lodash";
import * as Sentry from "@sentry/nextjs";
import { Tag } from "~/server/db/schema";
import { CanvasTour } from "./CanvasTour";

interface SaveCanvasButtonProps {
  pageId: string;
  className?: string;
  setAutoSaveStatus: (status: "idle" | "saving" | "saved" | "error") => void;
  tags: Tag[];
}

const myAssetStore: TLAssetStore = {
  async upload(asset, file) {
    let metadata = {
      prompt: "",
      description: "",
    };

    try {
      // Read clipboard items
      const clipboardItems = await navigator.clipboard.read();

      for (const item of clipboardItems) {
        if (item.types.includes("text/plain")) {
          const textBlob = await item.getType("text/plain");
          const text = await textBlob.text();

          try {
            const parsedData = JSON.parse(text);
            if (
              parsedData &&
              (parsedData.prompt !== undefined ||
                parsedData.description !== undefined)
            ) {
              metadata = {
                prompt: parsedData.prompt || "",
                description: parsedData.description || "",
              };
            }
          } catch (err) {
            toast.error("Could not access clipboard");
            Sentry.captureException(err);
          }
        }
      }
    } catch (err) {
      toast.error("Could not access clipboard");
      Sentry.captureException(err);
    }
    const formData = new FormData();
    formData.append("file", file);
    toast.loading("Uploading image...");
    const response = await fetch("/api/image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload image");
    }

    const { pinataData } = (await response.json()) as ImageResponse;
    toast.dismiss();

    // Return gateway URL to the uploaded image
    return {
      src: `https://purple-defensive-anglerfish-674.mypinata.cloud/ipfs/${pinataData.IpfsHash}`,
      meta: {
        prompt: metadata.prompt,
        description: metadata.description,
      },
    };
  },

  resolve(asset) {
    return asset.props.src;
  },
};

export function SaveCanvasButton({
  pageId,
  className,
  setAutoSaveStatus,
  tags,
}: SaveCanvasButtonProps) {
  const editor = useEditor();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState("");
  const lastSaveTimeRef = useRef<number>(Date.now());
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Export canvas image function
  const exportCanvasImage = async () => {
    if (!editor) return null;

    try {
      // Export the canvas as a PNG image
      const shapeIds = editor.getCurrentPageShapeIds();
      if (shapeIds.size === 0) return;
      const { blob } = await editor.toImage([...shapeIds], {
        format: "png",
        background: false,
      });

      // Create a File from the blob
      const file = new File([blob], `canvas-${pageId}.png`, {
        type: "image/png",
      });

      // Upload to Pinata using the existing image route
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload canvas image");
      }

      const { pinataData } = (await response.json()) as ImageResponse;
      return pinataData.IpfsHash;
    } catch (error) {
      console.error("Error exporting canvas:", error);
      return null;
    }
  };

  const handleSave = async () => {
    if (!editor || isSaving) return;
    setIsSaving(true);
    setAutoSaveStatus("saving");

    try {
      // 1. Get all shapes on the canvas and find which assets are actually in use
      const shapes = Array.from(editor.getCurrentPageShapes());
      const usedAssetIds = new Set(
        shapes
          .filter((shape) => shape.type === "image")
          .map((shape) => {
            // Access assetId safely with type assertion and optional chaining
            return (shape as any).props?.assetId;
          })
          .filter(Boolean),
      );

      // 2. Get only the assets that are currently used in shapes
      const allAssets = Array.from(editor.getAssets());
      const activeAssets = allAssets.filter((asset) =>
        usedAssetIds.has(asset.id),
      );

      // 3. Process the active assets to extract Pinata metadata
      const assetMetadata = activeAssets.map((asset) => {
        const src = asset.props.src || "";
        let ipfsHash = null;

        if (src && src.includes("mypinata.cloud/ipfs/")) {
          const matches = src.match(/ipfs\/([^/?#]+)/);
          ipfsHash = matches?.[1] || null;
        }

        return {
          id: asset.id,
          src,
          type: asset.type,
          ipfsHash,
          meta: asset.meta,
        };
      });

      // Export and upload the canvas image
      toast.loading("Generating canvas preview...");
      const canvasImageCid = await exportCanvasImage();
      toast.dismiss();

      // Get the snapshot
      const snapshot = getSnapshot(editor.store);

      // Send snapshot, asset metadata, and canvas image CID to server
      const response = await saveCanvasData(
        pageId,
        snapshot,
        assetMetadata,
        canvasImageCid || null,
        tags.map((tag) => tag.id),
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to save canvas");
      }

      // After successful save, update tracking variables
      setLastSavedSnapshot(JSON.stringify(snapshot));
      lastSaveTimeRef.current = Date.now();

      toast.success("Canvas saved successfully!");
      setAutoSaveStatus("saved");

      // 5. Show additional info about sync results
      if (response.created && response.created > 0) {
        toast.info(`Created ${response.created} new cards`);
      }
      if (response.deleted && response.deleted > 0) {
        toast.info(`Removed ${response.deleted} outdated cards`);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save canvas",
      );
      console.error("Error saving canvas:", error);
      setAutoSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  // Manual save with debounce for button click
  const debouncedSave = useCallback(
    debounce(async () => {
      await handleSave();
    }, 1000), // 1 second delay
    [handleSave],
  );

  return (
    <button onClick={debouncedSave} className={className}>
      <SaveIcon className="tlui-button tlui-button-icon" />
    </button>
  );
}

export default function CanvasEditor({
  title,
  content,
  pageId,
  tags,
}: {
  title: string;
  content: any;
  pageId: string;
  tags: Tag[];
}) {
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  // Custom toolbar that includes our Lucide icon button
  const components: TLComponents = {
    Toolbar: (props) => {
      return (
        <DefaultToolbar {...props}>
          <SaveCanvasButton
            pageId={pageId}
            setAutoSaveStatus={setAutoSaveStatus}
            tags={tags}
          />
          <DefaultToolbarContent />
        </DefaultToolbar>
      );
    },
  };

  const overrides: TLUiOverrides = {
    actions: (editor, actions) => {
      return {
        ...actions,
        "copy-as-png": {
          ...actions["copy-as-png"],
          id: "copy-as-png",
          onSelect: async () => {
            const shapes = editor.getSelectedShapes();
            if (shapes.length === 0) return;

            const { blob } = await editor.toImage(
              shapes.map((shape) => shape.id),
              {
                format: "png",
                background: false,
                padding: 0,
              },
            );

            let metadata = null;
            if (
              shapes.length === 1 &&
              shapes[0]?.type === "image" &&
              (shapes[0] as any).props?.assetId
            ) {
              const asset = editor.getAsset((shapes[0] as any).props.assetId);
              if (asset?.meta) {
                metadata = {
                  prompt: asset.meta.prompt || "",
                  description: asset.meta.description || "",
                  // Add any other metadata fields you want to preserve
                };
              }
            }

            if (blob) {
              try {
                const item = new ClipboardItem({
                  "image/png": blob,
                  "text/plain": new Blob([JSON.stringify(metadata)], {
                    type: "text/plain",
                  }),
                });
                await navigator.clipboard.write([item]);
              } catch (err) {
                // Fallback: Create a temporary link to download the image
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "canvas.png";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }
            }
          },
        },
      };
    },
  };

  return (
    <div className="relative flex h-[100dvh] max-h-[85dvh] w-full overflow-hidden">
      <CanvasTour>
        <div className="absolute bottom-10 right-2 z-50">
          <div className="auto-save-indicator">
            {autoSaveStatus === "idle" && (
              <span className="text-xs text-gray-400">Auto-save ready</span>
            )}
            {autoSaveStatus === "saving" && (
              <span className="text-xs text-blue-400">Saving...</span>
            )}
            {autoSaveStatus === "saved" && (
              <span className="text-xs text-green-400">Saved</span>
            )}
            {autoSaveStatus === "error" && (
              <span className="text-xs text-red-400">Save failed</span>
            )}
          </div>
        </div>
        <Tldraw
          components={components}
          options={{ maxPages: 1 }}
          persistenceKey={`${pageId}-canvas`}
          snapshot={content}
          assets={myAssetStore}
          overrides={overrides}
        />
      </CanvasTour>
    </div>
  );
}
