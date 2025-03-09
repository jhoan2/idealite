import { Suspense } from "react";
import {
  getPageContent,
  getPageTitle,
  getPageTags,
} from "~/server/queries/page";
import { auth } from "~/app/auth";
import { getUserTagTree } from "~/server/queries/usersTags";
import PageEditors from "./PageEditors";
import { PageHeader } from "~/app/workspace/(Page)/PageHeader";
import CanvasEditor from "./(Canvas)/CanvasEditor";
import { getResourcesForPage } from "~/server/queries/resource";
import HeaderSkeleton from "./HeaderSkeleton";
import EditorSkeleton from "./EditorSkeleton";

export default async function PageContent({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await auth();
  const userId = session?.user?.id;
  const pageIdParam = searchParams.pageId;
  const pageId = typeof pageIdParam === "string" ? pageIdParam : undefined;

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

  return (
    <div className="h-full w-full">
      <Suspense fallback={<HeaderSkeleton />}>
        <PageHeader
          tags={tags}
          userTagTree={userTagTree}
          resources={resources}
        />
      </Suspense>
      <Suspense fallback={<EditorSkeleton />}>
        {content.content_type === "canvas" ? (
          <CanvasEditor title={title ?? ""} content={content} pageId={pageId} />
        ) : (
          <PageEditors
            key={pageId}
            title={title ?? ""}
            content={content}
            userTagTree={userTagTree}
            tags={tags}
          />
        )}
      </Suspense>
    </div>
  );
}
