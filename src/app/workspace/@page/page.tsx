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
