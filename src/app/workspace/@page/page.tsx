import { Suspense } from "react";
import {
  getPageContent,
  getPageTitle,
  getPageTags,
} from "~/server/queries/page";
import { currentUser } from "@clerk/nextjs/server";
import { getUserTagTree } from "~/server/queries/usersTags";
import PageEditors from "./PageEditors";
import { PageHeader } from "~/app/workspace/(Page)/PageHeader";
import CanvasEditor from "./(Canvas)/CanvasEditor";
import { getResourcesForPage } from "~/server/queries/resource";
import HeaderSkeleton from "./HeaderSkeleton";
import EditorSkeleton from "./EditorSkeleton";
import { headers } from "next/headers";

export default async function PageContent({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const user = await currentUser();
  const userId = user?.externalId;
  const pageIdParam = searchParams.pageId;
  const pageId = typeof pageIdParam === "string" ? pageIdParam : undefined;
  const headersList = headers();
  const userAgent = headersList.get("user-agent");

  const isMobile = userAgent?.toLowerCase().includes("mobile");
  const isWarpcast = userAgent?.toLowerCase().includes("warpcast");

  if (!pageId) {
    return null;
  }

  // Check if this is a temp page
  const isOptimistic = pageId.startsWith('temp-');
  
  if (isOptimistic) {
    // Return default data for temp pages
    const userTagTree = userId ? await getUserTagTree(userId) : [];
    
    return (
      <div className="h-full w-full">
        <Suspense fallback={<HeaderSkeleton />}>
          <PageHeader
            tags={[]} // Empty tags for now
            userTagTree={userTagTree}
            resources={[]} // Empty resources for now
            isMobile={isMobile ?? false}
            isWarpcast={isWarpcast ?? false}
          />
        </Suspense>
        <Suspense fallback={<EditorSkeleton />}>
          <PageEditors
            key={pageId}
            title="Untitled"
            content={{ content: "", content_type: "page" }}
            userTagTree={userTagTree}
            tags={[]}
            isMobile={isMobile ?? false}
            isWarpcast={isWarpcast ?? false}
            // Pass temp page info
            isOptimistic={true}
            tempId={pageId}
          />
        </Suspense>
      </div>
    );
  }

  const [title, content, tags, resources, userTagTree] = await Promise.all([
    getPageTitle(pageId) ?? "",
    getPageContent(pageId) ?? "",
    getPageTags(pageId) ?? [],
    getResourcesForPage(pageId) ?? [],
    userId ? getUserTagTree(userId) : [],
  ]);

  let canvasSnapshot: any = null;
  if (content.content_type === "canvas") {
    try {
      canvasSnapshot = JSON.parse(content.content);
    } catch (err) {
      console.error("Failed to parse canvas JSON on server:", err);
      // fallback to an empty snapshot or handle error
      canvasSnapshot = { document: "" };
    }
  }

  return (
    <div className="h-full w-full">
      <Suspense fallback={<HeaderSkeleton />}>
        <PageHeader
          tags={tags}
          userTagTree={userTagTree}
          resources={resources}
          isMobile={isMobile ?? false}
          isWarpcast={isWarpcast ?? false}
        />
      </Suspense>
      <Suspense fallback={<EditorSkeleton />}>
        {content.content_type === "canvas" ? (
          <CanvasEditor
            title={title ?? ""}
            content={canvasSnapshot}
            pageId={pageId}
            tags={tags}
            userTagTree={userTagTree}
            isMobile={isMobile ?? false}
            isWarpcast={isWarpcast ?? false}
          />
        ) : (
          <PageEditors
            key={pageId}
            title={title ?? ""}
            content={content}
            userTagTree={userTagTree}
            tags={tags}
            isMobile={isMobile ?? false}
            isWarpcast={isWarpcast ?? false}
          />
        )}
      </Suspense>
    </div>
  );
}
