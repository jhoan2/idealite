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
  useValue,
  TLUiAssetUrlOverrides,
  Box,
  TldrawUiMenuItem,
  useTools,
  useIsToolSelected,
  TLUiToolItem,
} from "tldraw";
import "tldraw/tldraw.css";
import { toast } from "sonner";
import { useCallback, useState, useRef, useEffect } from "react";
import { ImageResponse } from "~/app/api/image/route";
import { saveCanvasData } from "~/server/actions/canvas";
import { debounce } from "lodash";
import * as Sentry from "@sentry/nextjs";
import { Tag } from "~/server/db/schema";
import { CanvasTour } from "./CanvasTour";
import { MobileCanvasTour } from "./MobileCanvasTour";
import { TreeTag } from "~/server/queries/usersTags";
import HeadingEditor from "../HeadingEditor";
import { ScreenshotTool } from "./SnippetTool/Screenshot";
import { ScreenshotDragging } from "./SnippetTool/ChildStates/Dragging";

const myAssetStore: TLAssetStore = {
  async upload(asset, file) {
    const tempSrc = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    let metadata = {
      description: "",
      status: "uploading",
    };

    try {
      const clipboardItems = await navigator.clipboard.read();

      for (const item of clipboardItems) {
        if (item.types.includes("text/plain")) {
          const textBlob = await item.getType("text/plain");
          const text = await textBlob.text();

          try {
            const parsedData = JSON.parse(text);
            if (parsedData && parsedData.description !== undefined) {
              metadata.description = parsedData.description || "";
            }
          } catch (err) {
            console.warn("Failed to access clipboard:", err);
          }
        }
      }
    } catch (err) {
      console.warn("Failed to access clipboard:", err);
    }

    const tempAsset = {
      src: tempSrc,
      meta: {
        ...metadata,
        tempId: asset.id,
        description: metadata.description,
      },
    };

    window.setTimeout(async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        toast.loading("Uploading image...");

        const response = await fetch("/api/image", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorResponse = await response
            .text()
            .catch(() => "No response data");
          throw new Error(`Failed to upload image: ${errorResponse}`);
        }

        const { pinataData } = (await response.json()) as ImageResponse;
        toast.dismiss();

        window.dispatchEvent(
          new CustomEvent("tldraw:asset:uploaded", {
            detail: {
              assetId: asset.id,
              src: `https://purple-defensive-anglerfish-674.mypinata.cloud/ipfs/${pinataData.IpfsHash}`,
              meta: {
                description: metadata.description,
                status: "uploaded",
                ipfsHash: pinataData.IpfsHash,
              },
            },
          }),
        );
      } catch (error) {
        toast.dismiss();
        toast.error("Image upload failed. Please try again.");
        Sentry.captureException(error);
      }
    }, 0);

    return tempAsset;
  },

  resolve(asset) {
    return asset.props.src;
  },
};

export default function CanvasEditor({
  title,
  content,
  pageId,
  tags,
  userTagTree,
  isMobile,
  isWarpcast,
}: {
  title: string;
  content: any;
  pageId: string;
  tags: Tag[];
  userTagTree: TreeTag[];
  isMobile: boolean;
  isWarpcast: boolean;
}) {
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const editorRef = useRef<ReturnType<typeof useEditor> | null>(null);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const lastSavedSnapshotRef = useRef<string>("");
  const lastSaveTimeRef = useRef<number>(Date.now());

  // Export canvas image function
  const exportCanvasImage = async () => {
    if (!editorRef.current) return null;

    try {
      const shapeIds = editorRef.current.getCurrentPageShapeIds();
      if (shapeIds.size === 0) return null;

      const { blob } = await editorRef.current.toImage([...shapeIds], {
        format: "jpeg",
        background: false,
        quality: 1,
        scale: 0.5,
        padding: 0,
      });

      let newBlob = blob;

      if (newBlob.size > 900000) {
        const { blob: smallerBlob } = await editorRef.current.toImage(
          [...shapeIds],
          {
            format: "jpeg",
            background: false,
            quality: 1,
            scale: 0.25,
            padding: 0,
          },
        );

        if (smallerBlob.size > 1000000) {
          toast.warning("Canvas is too large for preview generation");
          return null;
        }

        newBlob = smallerBlob;
      }

      const file = new File([newBlob], `canvas-${pageId}.jpeg`, {
        type: "image/jpeg",
      });

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorResponse = await response
          .text()
          .catch(() => "No response data");
        throw new Error(`Failed to upload canvas image: ${errorResponse}`);
      }

      const { pinataData } = (await response.json()) as ImageResponse;
      return pinataData.IpfsHash;
    } catch (error) {
      Sentry.captureException(error);
      console.error("Error exporting canvas:", error);
      return null;
    }
  };

  const handleSave = async () => {
    if (!editorRef.current) return false;

    if (autoSaveStatus === "saving") return false;

    setAutoSaveStatus("saving");

    try {
      const editor = editorRef.current;

      const shapes = Array.from(editor.getCurrentPageShapes());
      const usedAssetIds = new Set(
        shapes
          .filter((shape) => shape.type === "image")
          .map((shape) => {
            return (shape as any).props?.assetId;
          })
          .filter(Boolean),
      );

      const allAssets = Array.from(editor.getAssets());
      const activeAssets = allAssets.filter((asset) =>
        usedAssetIds.has(asset.id),
      );

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

      const snapshot = getSnapshot(editor.store);
      const snapshotStr = JSON.stringify(snapshot);

      let canvasImageCid = null;
      const timeSinceLastSave = Date.now() - lastSaveTimeRef.current;
      const needsNewPreview = timeSinceLastSave > 1 * 60 * 1000;

      if (needsNewPreview) {
        toast.loading("Generating canvas preview...");
        canvasImageCid = await exportCanvasImage();
        toast.dismiss();
      }

      const response = await saveCanvasData(
        pageId,
        snapshot,
        assetMetadata,
        canvasImageCid,
        tags.map((tag) => tag.id),
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to save canvas");
      }

      lastSavedSnapshotRef.current = snapshotStr;
      lastSaveTimeRef.current = Date.now();
      setHasUnsavedChanges(false);

      if (needsNewPreview) {
        toast.success("Canvas saved successfully!");
      }

      setAutoSaveStatus("saved");

      if (response.created && response.created > 0) {
        toast.info(`Created ${response.created} new cards`);
      }
      if (response.deleted && response.deleted > 0) {
        toast.info(`Removed ${response.deleted} outdated cards`);
      }

      return true;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save canvas",
      );
      console.error("Error saving canvas:", error);
      setAutoSaveStatus("error");
      return false;
    } finally {
      setTimeout(() => {
        if (autoSaveStatus === "saved") {
          setAutoSaveStatus("idle");
        }
      }, 2000);
    }
  };

  const debouncedSave = useCallback(
    debounce(() => {
      if (hasUnsavedChanges) {
        handleSave();
      }
    }, 3000),
    [hasUnsavedChanges],
  );

  useEffect(() => {
    if (!editorRef.current) return;

    const editor = editorRef.current;

    const handleEditorChange = () => {
      setHasUnsavedChanges(true);
      debouncedSave();
    };

    const unsubscribe = editor.store.listen(handleEditorChange);

    return () => {
      unsubscribe();
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  useEffect(() => {
    const handleAssetUploaded = (event: CustomEvent) => {
      const { assetId, src, w, h, meta } = event.detail;

      if (editorRef.current) {
        // Get the current state of the asset
        const asset = editorRef.current.getAsset(assetId);
        if (asset) {
          // Update the asset with the new URL but preserve other properties
          editorRef.current.updateAssets([
            {
              id: assetId,
              type: asset.type,
              props: {
                ...asset.props,
                src: src,
                // Ensure width and height are set
                w: w || asset.props.w,
                h: h || asset.props.h,
              },
              meta: {
                ...asset.meta,
                ...meta,
                description: meta.description || asset.meta.description || "",
              },
            },
          ]);

          // Mark as having unsaved changes when an asset is updated
          setHasUnsavedChanges(true);
        }
      }
    };

    // Add event listener for completed uploads
    window.addEventListener(
      "tldraw:asset:uploaded",
      handleAssetUploaded as EventListener,
    );

    // Clean up function
    return () => {
      window.removeEventListener(
        "tldraw:asset:uploaded",
        handleAssetUploaded as EventListener,
      );
    };
  }, []);

  // Store editor reference when it's available
  const handleMount = useCallback((editor: ReturnType<typeof useEditor>) => {
    editorRef.current = editor;
  }, []);

  const customTools = [ScreenshotTool];

  function CustomToolbar() {
    const tools = useTools();
    const isScreenshotSelected = useIsToolSelected(
      tools["screenshot"] as TLUiToolItem<string, string>,
    );
    return (
      <DefaultToolbar>
        <TldrawUiMenuItem
          {...(tools["screenshot"] as TLUiToolItem<string, string>)}
          isSelected={isScreenshotSelected}
        />
        <DefaultToolbarContent />
      </DefaultToolbar>
    );
  }

  const components: TLComponents = {
    InFrontOfTheCanvas: ScreenshotBox,
    Toolbar: CustomToolbar,
  };

  const customAssetUrls: TLUiAssetUrlOverrides = {
    icons: {
      "tool-screenshot": "/tool-screenshot.svg",
    },
  };

  function ScreenshotBox() {
    const editor = useEditor();

    const screenshotBrush = useValue(
      "screenshot brush",
      () => {
        // Check whether the screenshot tool (and its dragging state) is active
        if (editor.getPath() !== "screenshot.dragging") return null;

        // Get screenshot.dragging state node
        const draggingState = editor.getStateDescendant<ScreenshotDragging>(
          "screenshot.dragging",
        )!;

        // Get the box from the screenshot.dragging state node
        const box = draggingState.screenshotBox.get();

        // The box is in "page space", i.e. panned and zoomed with the canvas, but we
        // want to show it in front of the canvas, so we'll need to convert it to
        // "page space", i.e. uneffected by scale, and relative to the tldraw
        // page's top left corner.
        const zoomLevel = editor.getZoomLevel();
        const { x, y } = editor.pageToViewport({ x: box.x, y: box.y });
        return new Box(x, y, box.w * zoomLevel, box.h * zoomLevel);
      },
      [editor],
    );

    if (!screenshotBrush) return null;

    return (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          transform: `translate(${screenshotBrush.x}px, ${screenshotBrush.y}px)`,
          width: screenshotBrush.w,
          height: screenshotBrush.h,
          border: "1px solid var(--color-text-0)",
          zIndex: 999,
        }}
      />
    );
  }

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
                format: "jpeg",
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
                  description: asset.meta.description || "",
                };
              }
            }

            if (blob) {
              try {
                const item = new ClipboardItem({
                  "image/jpeg": blob,
                  "text/plain": new Blob([JSON.stringify(metadata)], {
                    type: "text/plain",
                  }),
                });
                await navigator.clipboard.write([item]);
              } catch (err) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "canvas.jpeg";
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
    tools: (editor, tools) => {
      return {
        ...tools,
        screenshot: {
          id: "screenshot",
          label: "Screenshot",
          icon: "tool-screenshot",
          kbd: "j",
          onSelect() {
            editor.setCurrentTool("screenshot");
          },
        },
      };
    },
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        handleSave();
        e.preventDefault();
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  return (
    <div
      className={`relative flex min-h-screen w-full flex-col overflow-y-auto pb-24`}
    >
      {isMobile || isWarpcast ? (
        <div className="relative flex h-[100dvh] max-h-[85dvh] w-full flex-col overflow-hidden">
          <MobileCanvasTour>
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
            <HeadingEditor
              key={pageId}
              initialTitle={title}
              pageId={pageId}
              userTagTree={userTagTree}
              immediatelyRender={true}
              onSavingStateChange={setIsSavingTitle}
              isCanvas={true}
            />
            <Tldraw
              components={components}
              options={{ maxPages: 1 }}
              persistenceKey={`${pageId}-canvas`}
              snapshot={content}
              overrides={overrides}
              tools={customTools}
              assets={myAssetStore}
              onMount={handleMount}
            />
          </MobileCanvasTour>
        </div>
      ) : (
        <CanvasTour>
          <div className="absolute bottom-10 right-2 z-50">
            <div className="auto-save-indicator">
              {autoSaveStatus === "idle" && hasUnsavedChanges && (
                <span className="text-xs text-yellow-400">Unsaved changes</span>
              )}
              {autoSaveStatus === "idle" && !hasUnsavedChanges && (
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
          <HeadingEditor
            key={pageId}
            initialTitle={title}
            pageId={pageId}
            userTagTree={userTagTree}
            immediatelyRender={true}
            onSavingStateChange={setIsSavingTitle}
            isCanvas={true}
          />
          <div className="relative flex h-[100dvh] max-h-[85dvh] w-full flex-col overflow-hidden">
            <Tldraw
              components={components}
              options={{ maxPages: 1 }}
              persistenceKey={`${pageId}-canvas`}
              snapshot={content}
              tools={customTools}
              assets={myAssetStore}
              overrides={overrides}
              onMount={handleMount}
            />
          </div>
        </CanvasTour>
      )}
    </div>
  );
}
