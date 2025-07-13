// app/mobile/global-tags/page.tsx
import { currentUser } from "@clerk/nextjs/server";
import { getTagWithChildren } from "~/server/queries/tag";
import { getUserTags } from "~/server/queries/usersTags";
import MobileGlobalTagsClient from "./MobileGlobalTagsClient";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

export default async function MobileGlobalTagsPage() {
  const user = await currentUser();
  const userId = user?.externalId;

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="p-6 text-center">
          <h1 className="mb-4 text-2xl font-bold text-destructive">
            Authentication Required
          </h1>
          <p className="text-muted-foreground">
            You must be signed in to access global tags.
          </p>
        </div>
      </div>
    );
  }

  try {
    const [tag, userTags] = await Promise.all([
      getTagWithChildren(process.env.NEXT_PUBLIC_ROOT_TAG_ID ?? ""),
      getUserTags(userId ?? ""),
    ]);

    return (
      <div className="h-screen w-full bg-background">
        <MobileGlobalTagsClient
          tag={tag}
          userTags={userTags}
          userId={userId ?? null}
        />
      </div>
    );
  } catch (error) {
    // Log error to Sentry with context
    Sentry.captureException(error, {
      tags: {
        component: "MobileGlobalTagsPage",
        userId: userId,
      },
    });

    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="p-6 text-center">
          <h1 className="mb-4 text-2xl font-bold text-destructive">
            Error Loading Tags
          </h1>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : "Failed to load tag data"}
          </p>
          <button
            className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
}
