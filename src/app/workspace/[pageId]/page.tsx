import { getPageContent, getPageTitle } from "~/server/queries/page";
import PageEditors from "./PageEditors";
import { auth } from "~/app/auth";
import { getUserTagTree } from "~/server/queries/usersTags";
import CanvasEditor from "./(Canvas)/CanvasEditor";

export default async function WorkspacePage({
  params,
}: {
  params: { pageId: string };
}) {
  const title = (await getPageTitle(params.pageId)) ?? "";
  const content = (await getPageContent(params.pageId)) ?? "";
  const session = await auth();
  const userId = session?.user?.id;
  const userTagTree = userId ? await getUserTagTree(userId) : [];

  return (
    <div>
      {content.content_type === "canvas" ? (
        <CanvasEditor title={title} content={content} pageId={params.pageId} />
      ) : (
        <PageEditors
          title={title}
          content={content}
          userTagTree={userTagTree}
        />
      )}
    </div>
  );
}
