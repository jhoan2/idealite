// app/mobile/canvas/page.tsx
import { currentUser } from "@clerk/nextjs/server";
import { RetryButton } from "./RetryButton";
import { getPageContent, getPageTags } from "~/server/queries/page";
import { getUserTagTree } from "~/server/queries/usersTags";
import MobileCanvas from "./MobileCanvas";

export const dynamic = "force-dynamic";

export default async function MobileCanvasPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const pageId = searchParams.pageId as string;

  // Check authentication
  const user = await currentUser();

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="p-4 text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-600">
            Authentication Required
          </h1>
          <p className="mb-4 text-muted-foreground">
            You must be signed in to access the mobile canvas.
          </p>
          <div className="mt-4">
            <RetryButton />
          </div>
        </div>
      </div>
    );
  }

  if (!pageId) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <h1 className="mb-2 text-xl font-bold">Page ID Required</h1>
          <p className="text-muted-foreground">
            Please provide a valid pageId parameter.
          </p>
        </div>
      </div>
    );
  }

  try {
    // Fetch page data
    const [pageContent, pageTags, userTagTree] = await Promise.all([
      getPageContent(pageId),
      getPageTags(pageId),
      getUserTagTree(user.externalId!),
    ]);

    // Parse canvas content if it exists
    let parsedContent = null;
    if (pageContent.content && pageContent.content_type === "canvas") {
      try {
        parsedContent = JSON.parse(pageContent.content);
      } catch (error) {
        console.error("Error parsing canvas content:", error);
        // If parsing fails, start with empty canvas
        parsedContent = { document: "" };
      }
    }

    return (
      <div className="h-screen w-full">
        <MobileCanvas
          pageId={pageId}
          content={parsedContent}
          tags={pageTags}
          userTagTree={userTagTree}
        />
      </div>
    );
  } catch (error) {
    console.error("Error fetching page data:", error);

    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="p-4 text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-600">
            Error Loading Canvas
          </h1>
          <p className="mb-4 text-muted-foreground">
            {error instanceof Error
              ? error.message
              : "Failed to load canvas data"}
          </p>
          <div className="mt-4">
            <RetryButton />
          </div>
        </div>
      </div>
    );
  }
}
