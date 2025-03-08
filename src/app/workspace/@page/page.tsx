import {
  getPageContent,
  getPageTitle,
  getPageTags,
} from "~/server/queries/page";
// import { getPageResources } from "~/server/queries/resource";
import { auth } from "~/app/auth";
import { getUserTagTree } from "~/server/queries/usersTags";
import PageEditors from "./PageEditors";
import { PageHeader } from "~/app/workspace/(Page)/PageHeader";
import CanvasEditor from "./(Canvas)/CanvasEditor";
import { getResourcesForPage } from "~/server/queries/resource";
import { Resource } from "~/server/queries/resource";

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
      <PageHeader tags={tags} userTagTree={userTagTree} resources={resources} />

      {content.content_type === "canvas" ? (
        <CanvasEditor title={title ?? ""} content={content} pageId={pageId} />
      ) : (
        <PageEditors
          title={title ?? ""}
          content={content}
          userTagTree={userTagTree}
        />
      )}
    </div>
  );
}
