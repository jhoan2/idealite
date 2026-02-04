// app/mobile/global-tags/MobileGlobalTagsClient.tsx
"use client";

import { useMemo, useState } from "react";
import { SelectTag } from "~/server/queries/tag";
import GlobalTagsFlow from "../../workspace/global-tags/GlobalTagsFlow";
import * as Sentry from "@sentry/nextjs";
import { createTagTree, TagNode } from "../../workspace/global-tags/tagUtils";

interface MobileGlobalTagsClientProps {
  tag: SelectTag[];
  userTags: SelectTag[];
  userId: string | null;
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
      <GlobalTagsFlow tagTree={tagTree} isMobile={true} />
    </div>
  );
}
