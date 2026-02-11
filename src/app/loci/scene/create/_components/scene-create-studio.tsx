"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  AssetRecordType,
  createShapeId,
  getSnapshot,
  Tldraw,
  type Editor,
  type TLEditorSnapshot,
  type TLImageShape,
  type TLUiComponents,
} from "tldraw";
import "tldraw/tldraw.css";
import {
  ImageIcon,
  Loader2,
  Plus,
  Search,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { cn } from "~/lib/utils";

type LibraryKind = "stickers" | "loci";

type LibraryAsset = {
  id: string;
  title: string;
  kind: LibraryKind;
  tags: string[];
  width: number;
  height: number;
  src: string;
  defaultReviewable: boolean;
};

interface SceneCreateStudioProps {
  initialSceneId?: string;
}

type SyncStatus = "idle" | "saving" | "saved" | "error";

type SceneNodePayload = {
  id?: string;
  shape_id: string;
  image_id: string;
  x: number;
  y: number;
  scale_x: number;
  scale_y: number;
  rotation: number;
  layer_order: number;
  label: string | null;
  is_reviewable: boolean;
};

const ACTIVE_SCENE_STORAGE_KEY = "loci:active-scene-id";
const SYNC_DEBOUNCE_MS = 3000;
const MAX_SYNC_RETRY_ATTEMPTS = 4;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SCENE_TLDRAW_COMPONENTS = {
  MainMenu: null,
  PageMenu: null,
} satisfies TLUiComponents;

function buildSvgAsset({
  label,
  marker,
  background,
  accent,
}: {
  label: string;
  marker: string;
  background: string;
  accent: string;
}) {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="420" height="300" viewBox="0 0 420 300">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${background}" />
        <stop offset="100%" stop-color="${accent}" />
      </linearGradient>
      <filter id="shadow">
        <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="rgba(0,0,0,0.2)" />
      </filter>
    </defs>
    <rect width="420" height="300" rx="24" fill="url(#bg)" />
    <rect x="24" y="24" width="372" height="252" rx="18" fill="rgba(255,255,255,0.14)" filter="url(#shadow)" />
    <text x="44" y="84" font-family="Arial, sans-serif" font-size="44">${marker}</text>
    <text x="44" y="140" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#fff">${label}</text>
    <circle cx="356" cy="72" r="26" fill="rgba(255,255,255,0.22)" />
    <circle cx="340" cy="228" r="16" fill="rgba(255,255,255,0.25)" />
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const LIBRARY_ASSETS: LibraryAsset[] = [
  {
    id: "sticker-rocket",
    title: "Rocket Recall",
    kind: "stickers",
    tags: ["rocket", "speed", "launch"],
    width: 280,
    height: 200,
    defaultReviewable: true,
    src: buildSvgAsset({
      label: "Rocket Recall",
      marker: "R",
      background: "#3b82f6",
      accent: "#7c3aed",
    }),
  },
  {
    id: "sticker-castle",
    title: "Castle Anchor",
    kind: "stickers",
    tags: ["castle", "memory", "anchor"],
    width: 280,
    height: 200,
    defaultReviewable: true,
    src: buildSvgAsset({
      label: "Castle Anchor",
      marker: "C",
      background: "#0ea5e9",
      accent: "#2563eb",
    }),
  },
  {
    id: "sticker-forest",
    title: "Forest Hook",
    kind: "stickers",
    tags: ["forest", "path", "nature"],
    width: 280,
    height: 200,
    defaultReviewable: true,
    src: buildSvgAsset({
      label: "Forest Hook",
      marker: "F",
      background: "#16a34a",
      accent: "#0f766e",
    }),
  },
  {
    id: "loci-library",
    title: "Library Hall",
    kind: "loci",
    tags: ["library", "hall", "shelves"],
    width: 320,
    height: 220,
    defaultReviewable: false,
    src: buildSvgAsset({
      label: "Library Hall",
      marker: "L",
      background: "#1d4ed8",
      accent: "#312e81",
    }),
  },
  {
    id: "loci-mountain",
    title: "Mountain Road",
    kind: "loci",
    tags: ["mountain", "road", "journey"],
    width: 320,
    height: 220,
    defaultReviewable: false,
    src: buildSvgAsset({
      label: "Mountain Road",
      marker: "M",
      background: "#2563eb",
      accent: "#0ea5e9",
    }),
  },
  {
    id: "loci-planetarium",
    title: "Planetarium Dome",
    kind: "loci",
    tags: ["planetarium", "stars", "space"],
    width: 320,
    height: 220,
    defaultReviewable: false,
    src: buildSvgAsset({
      label: "Planetarium",
      marker: "P",
      background: "#4338ca",
      accent: "#0f172a",
    }),
  },
];

function getSyncStatusLabel(status: SyncStatus, dirty: boolean) {
  if (status === "saving") return "Saving";
  if (status === "saved") return "Saved";
  if (status === "error") return "Error";
  if (dirty) return "Unsynced";
  return "Idle";
}

function projectSceneNodes(editor: Editor): {
  nodes: SceneNodePayload[];
  imageShapeCount: number;
  unmappedImageShapeCount: number;
} {
  const imageShapes = editor
    .getCurrentPageShapes()
    .filter((shape): shape is TLImageShape => shape.type === "image");
  const nodes: SceneNodePayload[] = [];
  let unmappedImageShapeCount = 0;

  imageShapes.forEach((shape, index) => {
    const assetId = shape.props.assetId;
    if (!assetId) {
      unmappedImageShapeCount += 1;
      return;
    }

    const asset = editor.getAsset(assetId);
    const assetMeta = (asset?.meta ?? {}) as Record<string, unknown>;
    const rawDbImageId = assetMeta.dbImageId;
    const dbImageId = typeof rawDbImageId === "string" ? rawDbImageId : undefined;
    if (!dbImageId || !UUID_PATTERN.test(dbImageId)) {
      unmappedImageShapeCount += 1;
      return;
    }

    const meta = (shape.meta ?? {}) as Record<string, unknown>;
    const sceneNodeId =
      typeof meta.sceneNodeId === "string" && UUID_PATTERN.test(meta.sceneNodeId)
        ? meta.sceneNodeId
        : undefined;
    const assetTitle =
      typeof assetMeta.title === "string" ? assetMeta.title : null;
    const isReviewable = assetMeta.isReviewable === true;

    nodes.push({
      id: sceneNodeId,
      shape_id: shape.id,
      image_id: dbImageId,
      x: Math.round(shape.x),
      y: Math.round(shape.y),
      scale_x: 1,
      scale_y: 1,
      rotation: shape.rotation,
      layer_order: index,
      label: assetTitle,
      is_reviewable: isReviewable,
    });
  });

  return {
    nodes,
    imageShapeCount: imageShapes.length,
    unmappedImageShapeCount,
  };
}

export default function SceneCreateStudio({
  initialSceneId,
}: SceneCreateStudioProps) {
  const editorRef = useRef<Editor | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryAttemptRef = useRef(0);
  const lastSyncedHashRef = useRef<string>("");
  const isSyncingRef = useRef(false);

  const [activeKind, setActiveKind] = useState<LibraryKind>("stickers");
  const [query, setQuery] = useState("");
  const [draggingAssetId, setDraggingAssetId] = useState<string | null>(null);
  const [placedCount, setPlacedCount] = useState(0);
  const [sceneId, setSceneId] = useState<string | null>(initialSceneId ?? null);
  const [initialDocument, setInitialDocument] = useState<Record<string, unknown> | null>(
    null,
  );
  const [isInitializing, setIsInitializing] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [isDirty, setIsDirty] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [hasUnmappedImages, setHasUnmappedImages] = useState(false);

  const filteredAssets = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return LIBRARY_ASSETS.filter((asset) => {
      if (asset.kind !== activeKind) return false;
      if (!normalized) return true;
      return (
        asset.title.toLowerCase().includes(normalized) ||
        asset.tags.some((tag) => tag.toLowerCase().includes(normalized))
      );
    });
  }, [activeKind, query]);

  const editorSnapshot = useMemo<Partial<TLEditorSnapshot> | undefined>(() => {
    if (!initialDocument || Object.keys(initialDocument).length === 0) {
      return undefined;
    }
    return { document: initialDocument };
  }, [initialDocument]);

  const createScene = useCallback(async () => {
    const response = await fetch("/api/scenes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled Scene", canvas_state: {} }),
    });
    const payload = (await response.json()) as {
      scene?: { id: string; canvas_state?: Record<string, unknown> | null };
      error?: string;
    };

    if (!response.ok || !payload.scene) {
      throw new Error(payload.error ?? "Failed to create scene");
    }

    return payload.scene;
  }, []);

  const loadScene = useCallback(async (id: string) => {
    const response = await fetch(`/api/scenes/${id}`, {
      method: "GET",
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error("Failed to load scene");
    }
    const payload = (await response.json()) as {
      scene: { id: string; canvas_state?: Record<string, unknown> | null };
    };
    return payload.scene;
  }, []);

  useEffect(() => {
    let canceled = false;

    const initializeScene = async () => {
      setIsInitializing(true);
      try {
        const fromStorage =
          typeof window !== "undefined"
            ? window.localStorage.getItem(ACTIVE_SCENE_STORAGE_KEY)
            : null;
        const candidateSceneId = initialSceneId ?? fromStorage;

        if (candidateSceneId) {
          try {
            const existing = await loadScene(candidateSceneId);
            if (canceled) return;
            setSceneId(existing.id);
            setInitialDocument(
              (existing.canvas_state as Record<string, unknown> | null) ?? null,
            );
            if (typeof window !== "undefined") {
              window.localStorage.setItem(ACTIVE_SCENE_STORAGE_KEY, existing.id);
            }
            return;
          } catch {
            // Fall through to scene creation.
          }
        }

        const created = await createScene();
        if (canceled) return;
        setSceneId(created.id);
        setInitialDocument(
          (created.canvas_state as Record<string, unknown> | null) ?? null,
        );
        if (typeof window !== "undefined") {
          window.localStorage.setItem(ACTIVE_SCENE_STORAGE_KEY, created.id);
        }
      } catch (error) {
        console.error("Failed to initialize scene:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to initialize scene",
        );
      } finally {
        if (!canceled) setIsInitializing(false);
      }
    };

    void initializeScene();

    return () => {
      canceled = true;
    };
  }, [createScene, initialSceneId, loadScene]);

  const syncScene = useCallback(
    async (force = false) => {
      const editor = editorRef.current;
      if (!editor || !sceneId) return false;
      if (isSyncingRef.current && !force) return false;

      const snapshot = getSnapshot(editor.store) as {
        document?: Record<string, unknown>;
      };
      const document = snapshot.document ?? {};
      const nextHash = JSON.stringify(document);

      if (!force && nextHash === lastSyncedHashRef.current) {
        setIsDirty(false);
        return true;
      }

      isSyncingRef.current = true;
      setSyncStatus("saving");

      try {
        const sceneResponse = await fetch(`/api/scenes/${sceneId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          keepalive: force,
          body: JSON.stringify({ canvas_state: document }),
        });
        if (!sceneResponse.ok) {
          throw new Error("Failed to sync canvas");
        }

        const nodeProjection = projectSceneNodes(editor);
        setHasUnmappedImages(nodeProjection.unmappedImageShapeCount > 0);

        if (nodeProjection.imageShapeCount === 0) {
          const nodesResponse = await fetch(`/api/scenes/${sceneId}/nodes`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nodes: [] }),
          });
          if (!nodesResponse.ok) {
            throw new Error("Failed to sync scene nodes");
          }
        } else if (nodeProjection.unmappedImageShapeCount === 0) {
          const nodesResponse = await fetch(`/api/scenes/${sceneId}/nodes`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nodes: nodeProjection.nodes }),
          });
          if (!nodesResponse.ok) {
            throw new Error("Failed to sync scene nodes");
          }
        }

        lastSyncedHashRef.current = nextHash;
        retryAttemptRef.current = 0;
        if (retryTimerRef.current) {
          clearTimeout(retryTimerRef.current);
          retryTimerRef.current = null;
        }
        setIsDirty(false);
        setSyncStatus("saved");
        window.setTimeout(() => {
          setSyncStatus((current) => (current === "saved" ? "idle" : current));
        }, 1200);
        return true;
      } catch (error) {
        console.error("Scene sync failed:", error);
        setSyncStatus("error");
        setIsDirty(true);
        if (!force && retryAttemptRef.current < MAX_SYNC_RETRY_ATTEMPTS) {
          retryAttemptRef.current += 1;
          const retryDelay = Math.min(
            15000,
            Math.pow(2, retryAttemptRef.current) * 1000,
          );
          if (retryTimerRef.current) {
            clearTimeout(retryTimerRef.current);
          }
          retryTimerRef.current = setTimeout(() => {
            void syncScene(false);
          }, retryDelay);
        }
        return false;
      } finally {
        isSyncingRef.current = false;
      }
    },
    [sceneId],
  );

  const scheduleSync = useCallback(() => {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }
    syncTimerRef.current = setTimeout(() => {
      void syncScene(false);
    }, SYNC_DEBOUNCE_MS);
  }, [syncScene]);

  useEffect(() => {
    const flush = () => {
      void syncScene(true);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flush();
      }
    };

    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    window.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
      window.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [syncScene]);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
    };
  }, []);

  const handlePublish = useCallback(async () => {
    if (!sceneId) return;
    setIsPublishing(true);
    try {
      const synced = await syncScene(true);
      if (!synced) {
        toast.error("Sync failed. Fix sync errors before publish.");
        return;
      }

      const response = await fetch(`/api/scenes/${sceneId}/publish`, {
        method: "POST",
      });
      const payload = (await response.json()) as {
        summary?: {
          created: number;
          updated: number;
          unchanged: number;
          retired: number;
        };
        error?: string;
      };

      if (!response.ok || !payload.summary) {
        throw new Error(payload.error ?? "Failed to publish scene");
      }

      const summary = payload.summary;
      toast.success(
        `Published: +${summary.created} new, ${summary.updated} updated, ${summary.unchanged} unchanged, ${summary.retired} retired.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Publish failed");
    } finally {
      setIsPublishing(false);
    }
  }, [sceneId, syncScene]);

  const placeAssetOnCanvas = (
    asset: LibraryAsset,
    placement?: { x: number; y: number },
  ) => {
    const editor = editorRef.current;
    if (!editor) return;

    const assetId = AssetRecordType.createId();
    editor.createAssets([
      {
        id: assetId,
        type: "image",
        typeName: "asset",
        props: {
          name: `${asset.title}.svg`,
          src: asset.src,
          w: asset.width,
          h: asset.height,
          mimeType: "image/svg+xml",
          isAnimated: false,
        },
        meta: {
          source: "loci-scene-library",
          libraryAssetId: asset.id,
          dbImageId: null,
          title: asset.title,
          isReviewable: asset.defaultReviewable,
        },
      },
    ]);

    const point = placement ?? editor.getViewportPageBounds().center;
    const shapeId = createShapeId();

    editor.createShape({
      id: shapeId,
      type: "image",
      x: point.x - asset.width / 2,
      y: point.y - asset.height / 2,
      props: {
        assetId,
        w: asset.width,
        h: asset.height,
      },
    });

    editor.select(shapeId);
    setPlacedCount((prev) => prev + 1);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="min-h-0 overflow-hidden border-sidebar-border">
          <CardHeader className="space-y-3 border-b pb-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <ImageIcon className="h-4 w-4" />
                Scene Library
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Search your stickers or loci and place them on canvas.
              </p>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search stickers or loci..."
                className="pl-8"
              />
            </div>
            <Tabs
              value={activeKind}
              onValueChange={(value) => setActiveKind(value as LibraryKind)}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="stickers">Stickers</TabsTrigger>
                <TabsTrigger value="loci">Loci</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="min-h-0 p-0">
            <ScrollArea className="h-[calc(100vh-17rem)] min-h-[18rem]">
              <div className="space-y-3 p-3">
                {filteredAssets.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No results for this search.
                  </div>
                ) : (
                  filteredAssets.map((asset) => (
                    <article
                      key={asset.id}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData(
                          "text/loci-library-asset",
                          asset.id,
                        );
                        event.dataTransfer.effectAllowed = "copy";
                        setDraggingAssetId(asset.id);
                      }}
                      onDragEnd={() => setDraggingAssetId(null)}
                      className={cn(
                        "rounded-lg border bg-card p-2 transition",
                        draggingAssetId === asset.id && "opacity-60",
                      )}
                    >
                      <div className="overflow-hidden rounded-md border">
                        <Image
                          src={asset.src}
                          alt={asset.title}
                          width={420}
                          height={300}
                          className="h-24 w-full object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium">{asset.title}</p>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="secondary" className="text-[10px]">
                              {asset.kind}
                            </Badge>
                            <Badge
                              variant={
                                asset.defaultReviewable ? "default" : "outline"
                              }
                              className="text-[10px]"
                            >
                              {asset.defaultReviewable
                                ? "reviewable"
                                : "decor"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {asset.tags.slice(0, 3).map((tag) => (
                            <span
                              key={`${asset.id}-${tag}`}
                              className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => placeAssetOnCanvas(asset)}
                        >
                          <Plus className="mr-1.5 h-3.5 w-3.5" />
                          Add To Canvas
                        </Button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <section className="min-h-0 rounded-2xl border border-border bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 p-3 md:p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold">Scene Canvas</h2>
              <p className="text-xs text-muted-foreground">
                Local-first canvas with debounced scene sync.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{placedCount} placed</Badge>
              <Badge variant="secondary">
                {getSyncStatusLabel(syncStatus, isDirty)}
              </Badge>
              {hasUnmappedImages ? (
                <Badge variant="outline">Node sync pending image IDs</Badge>
              ) : null}
              <Button
                size="sm"
                variant="outline"
                onClick={() => void syncScene(true)}
                disabled={isInitializing || !sceneId || syncStatus === "saving"}
              >
                {syncStatus === "saving" ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <UploadCloud className="mr-1.5 h-3.5 w-3.5" />
                )}
                Save
              </Button>
              <Button
                size="sm"
                onClick={() => void handlePublish()}
                disabled={isInitializing || !sceneId || isPublishing}
              >
                {isPublishing ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                )}
                Publish
              </Button>
            </div>
          </div>

          <div
            className="relative h-[calc(100vh-15rem)] min-h-[28rem] overflow-hidden rounded-xl border bg-background shadow-sm"
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
            }}
            onDrop={(event) => {
              event.preventDefault();
              const assetId = event.dataTransfer.getData("text/loci-library-asset");
              const dropped = LIBRARY_ASSETS.find((asset) => asset.id === assetId);
              const editor = editorRef.current;
              if (!dropped || !editor) return;

              const dropPoint = editor.screenToPage({
                x: event.clientX,
                y: event.clientY,
              });

              placeAssetOnCanvas(dropped, { x: dropPoint.x, y: dropPoint.y });
              setDraggingAssetId(null);
            }}
          >
            {isInitializing ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Tldraw
                key={sceneId ?? "scene-draft"}
                components={SCENE_TLDRAW_COMPONENTS}
                options={{ maxPages: 1 }}
                persistenceKey={sceneId ? `loci-scene-${sceneId}` : "scene-draft"}
                snapshot={editorSnapshot}
                onMount={(editor) => {
                  editorRef.current = editor;
                  editor.setCameraOptions({ isLocked: true });
                  unsubscribeRef.current?.();
                  unsubscribeRef.current = editor.store.listen(() => {
                    setIsDirty(true);
                    scheduleSync();
                  });

                  const snapshot = getSnapshot(editor.store) as {
                    document?: Record<string, unknown>;
                  };
                  const document = snapshot.document ?? {};
                  lastSyncedHashRef.current = JSON.stringify(document);
                }}
              />
            )}

            {!draggingAssetId ? null : (
              <div className="pointer-events-none absolute inset-4 rounded-lg border-2 border-dashed border-primary/60 bg-primary/10" />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
