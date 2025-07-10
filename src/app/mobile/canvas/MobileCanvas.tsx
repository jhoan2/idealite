"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Tldraw,
  TLUiOverrides,
  useEditor,
  createShapeId,
  AssetRecordType,
  getSnapshot,
} from "tldraw";
import "tldraw/tldraw.css";
import { toast } from "sonner";
import { Tag } from "~/server/db/schema";
import { TreeTag } from "~/server/queries/usersTags";
// Removed saveCanvasData import - now using API route instead
import { debounce } from "lodash";
import { AutoSaveIndicator } from "./AutoSaveIndicator";

interface MobileCanvasProps {
  pageId: string;
  content: any;
  tags: Tag[];
  userTagTree: TreeTag[];
}

export default function MobileCanvas({
  pageId,
  content,
  tags,
  userTagTree,
}: MobileCanvasProps) {
  const editorRef = useRef<ReturnType<typeof useEditor> | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const lastSavedSnapshotRef = useRef<string>("");
  const lastSaveTimeRef = useRef<number>(Date.now());
  const saveAttemptCountRef = useRef<number>(0);
  const maxRetryAttempts = 3;

  // Helper: read __session token from document.cookie
  const getAuthToken = () => {
    const match = document.cookie.match(/__session=([^;]+)/);
    return match ? match[1] : "";
  };

  // Enhanced save function with retry logic - now calls API instead of server action
  const handleSave = useCallback(
    async (forceImmediate = false) => {
      if (!editorRef.current) {
        return false;
      }

      if (autoSaveStatus === "saving" && !forceImmediate) {
        return false;
      }

      // Check if content actually changed
      const currentSnapshot = JSON.stringify(
        getSnapshot(editorRef.current.store),
      );
      if (currentSnapshot === lastSavedSnapshotRef.current && !forceImmediate) {
        setHasUnsavedChanges(false);
        return true;
      }

      setAutoSaveStatus("saving");
      saveAttemptCountRef.current += 1;

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
          let r2Key = null;

          // Extract R2 key from Cloudflare URL
          if (src && src.includes("idealite.xyz/")) {
            const matches = src.match(/idealite\.xyz\/(.+)$/);
            r2Key = matches?.[1] || null;
          }

          return {
            id: asset.id,
            src,
            type: asset.type,
            r2Key,
            meta: asset.meta,
          };
        });

        const snapshot = getSnapshot(editor.store);

        // For mobile, we don't generate canvas previews to keep it lightweight
        const canvasImageCid = null;

        // Call the API route instead of server action
        const token = getAuthToken();
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        // Add authorization header if token is available
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const apiResponse = await fetch(`/api/v1/pages/${pageId}/canvas`, {
          method: "POST",
          headers,
          credentials: "include", // Include cookies for additional auth context
          body: JSON.stringify({
            content: snapshot,
            assetMetadata,
            canvasImageCid,
            tagIds: tags.map((tag) => tag.id),
          }),
        });

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json();
          throw new Error(errorData.error || `HTTP ${apiResponse.status}`);
        }

        const response = await apiResponse.json();

        if (!response.success) {
          throw new Error(response.error || "Failed to save canvas");
        }

        lastSavedSnapshotRef.current = currentSnapshot;
        lastSaveTimeRef.current = Date.now();
        saveAttemptCountRef.current = 0; // Reset retry counter on success
        setHasUnsavedChanges(false);
        setAutoSaveStatus("saved");

        if (response.created && response.created > 0) {
          toast.success(`Created ${response.created} new cards`);
        }
        if (response.deleted && response.deleted > 0) {
          toast.info(`Removed ${response.deleted} outdated cards`);
        }

        return true;
      } catch (error) {
        console.error("Error saving canvas:", error);

        // Retry logic for network errors
        if (saveAttemptCountRef.current < maxRetryAttempts) {
          toast.warning(
            `Save failed, retrying... (${saveAttemptCountRef.current}/${maxRetryAttempts})`,
          );
          // Exponential backoff: 2s, 4s, 8s
          const delay = Math.pow(2, saveAttemptCountRef.current) * 1000;
          setTimeout(() => {
            handleSave(true);
          }, delay);
        } else {
          toast.error(
            error instanceof Error ? error.message : "Failed to save canvas",
          );
          saveAttemptCountRef.current = 0; // Reset for next attempt
          setAutoSaveStatus("error");
        }

        return false;
      } finally {
        if (autoSaveStatus !== "error") {
          setTimeout(() => {
            if (autoSaveStatus === "saved") {
              setAutoSaveStatus("idle");
            }
          }, 2000);
        }
      }
    },
    [autoSaveStatus, pageId, tags],
  );

  // Enhanced debounced save with different delays based on context
  const debouncedSave = useCallback(
    debounce(() => {
      if (hasUnsavedChanges) {
        handleSave();
      }
    }, 3000), // Standard 3-second delay
    [hasUnsavedChanges, handleSave],
  );

  // Faster save for image uploads (more urgent)
  const debouncedImageSave = useCallback(
    debounce(() => {
      if (hasUnsavedChanges) {
        handleSave();
      }
    }, 1000), // Faster 1-second delay for images
    [hasUnsavedChanges, handleSave],
  );

  // Listen for changes to the editor
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
      debouncedImageSave.cancel();
    };
  }, [debouncedSave, debouncedImageSave]);

  // Enhanced asset update handler
  useEffect(() => {
    const handleAssetUploaded = () => {
      setHasUnsavedChanges(true);
      // Use faster save for image uploads
      debouncedImageSave();
    };

    window.addEventListener("canvas-image-added", handleAssetUploaded);

    return () => {
      window.removeEventListener("canvas-image-added", handleAssetUploaded);
    };
  }, [debouncedImageSave]);

  // Enhanced auto-save on unmount with proper async handling
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        // Cancel debounced saves and save immediately
        debouncedSave.cancel();
        debouncedImageSave.cancel();

        // For beforeunload, we need to save synchronously
        // This is a limitation of the browser API
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";

        // Attempt immediate save (fire and forget)
        handleSave(true);
      }
    };

    const handlePageHide = () => {
      if (hasUnsavedChanges) {
        // Cancel debounced saves
        debouncedSave.cancel();
        debouncedImageSave.cancel();

        // Immediate save for mobile
        handleSave(true);
      }
    };

    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges, handleSave, debouncedSave, debouncedImageSave]);

  // Handle manual save requests from React Native
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === "SAVE") {
          // Manual save - cancel debounced saves and save immediately
          debouncedSave.cancel();
          debouncedImageSave.cancel();
          handleSave(true);
          return;
        }

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

            console.log("📱 Image added, triggering save");
            setHasUnsavedChanges(true);
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
  }, [debouncedSave, debouncedImageSave, handleSave]);

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

    // Initialize with current content snapshot
    const initialSnapshot = JSON.stringify(getSnapshot(editor.store));
    lastSavedSnapshotRef.current = initialSnapshot;
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
      {/* Save Status Indicator */}
      <div className="absolute right-1 top-1 z-50">
        <div className="auto-save-indicator flex items-center gap-2">
          <AutoSaveIndicator
            status={autoSaveStatus}
            hasPending={hasUnsavedChanges}
          />
        </div>
      </div>

      <Tldraw
        forceMobile={true}
        options={{ maxPages: 1 }}
        snapshot={content}
        overrides={overrides}
        onMount={handleMount}
      />
    </div>
  );
}
