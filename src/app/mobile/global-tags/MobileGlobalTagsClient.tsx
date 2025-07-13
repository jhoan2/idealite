// app/mobile/global-tags/MobileGlobalTagsClient.tsx
"use client";

import { useMemo, useState } from "react";
import { SelectTag } from "~/server/queries/tag";
import MobileCirclePack from "./MobileCirclePack";
import * as Sentry from "@sentry/nextjs";

interface TagNode extends SelectTag {
  children: TagNode[];
  isInBoth: boolean;
}

interface MobileGlobalTagsClientProps {
  tag: SelectTag[];
  userTags: SelectTag[];
  userId: string | null;
}

function createTagTree(
  rootTags: SelectTag[],
  userTags: SelectTag[],
): TagNode[] {
  const userTagSet = new Set(userTags.map((tag) => tag.id));

  function buildTree(
    tags: SelectTag[],
    parentId: string | null = null,
  ): TagNode[] {
    return tags
      .filter((tag) => tag.parent_id === parentId)
      .map((tag) => ({
        ...tag,
        children: buildTree(tags, tag.id),
        isInBoth: userTagSet.has(tag.id),
      }));
  }

  return buildTree(rootTags);
}

export default function MobileGlobalTagsClient({
  tag,
  userTags,
  userId,
}: MobileGlobalTagsClientProps) {
  const [error, setError] = useState<string | null>(null);

  const tagTree = useMemo(() => {
    try {
      return createTagTree(tag, userTags);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create tag tree";
      setError(errorMessage);

      Sentry.captureException(err, {
        tags: {
          component: "MobileGlobalTagsClient",
          function: "createTagTree",
          userId: userId,
        },
      });

      return [];
    }
  }, [tag, userTags, userId]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-6">
        <div className="text-center">
          <h2 className="mb-4 text-xl font-bold text-destructive">
            Error Processing Tags
          </h2>
          <p className="text-muted-foreground">{error}</p>
          <button
            className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground"
            onClick={() => {
              setError(null);
              window.location.reload();
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!tagTree.length) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-6">
        <div className="text-center">
          <h2 className="mb-4 text-xl font-bold text-muted-foreground">
            No Tags Available
          </h2>
          <p className="text-muted-foreground">
            There are no tags to display at the moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      <MobileCirclePack tagTree={tagTree[0]} />
    </div>
  );
}
