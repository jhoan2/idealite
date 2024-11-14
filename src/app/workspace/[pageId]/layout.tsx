// import { getPageTagHierarchy } from "~/server/queries/page";
import { PageHeader } from "~/app/workspace/(Page)/PageHeader";
import { getUserTagTree } from "~/server/queries/usersTags";
import { auth } from "~/app/auth";
import { getResourcesForPage, Resource } from "~/server/queries/resource";
import { getPageTags } from "~/server/queries/page";
export default async function WorkspacePageLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { pageId: string };
}) {
  // const tagHierarchy = await getPageTagHierarchy(params.pageId);
  const session = await auth();
  const userId = session?.user?.id;
  const userTagTree = userId ? await getUserTagTree(userId) : [];
  const resources = userId ? await getResourcesForPage(params.pageId) : [];
  const pageTags = userId ? await getPageTags(params.pageId) : [];

  return (
    <div className="flex h-full w-full flex-col">
      <div className="w-full pb-4">
        <PageHeader
          tags={pageTags}
          userTagTree={userTagTree}
          resources={resources as Resource[]}
        />
      </div>
      <div className="w-full flex-1">{children}</div>
    </div>
  );
}
