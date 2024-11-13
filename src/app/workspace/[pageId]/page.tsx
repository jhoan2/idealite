import { getPageContent, getPageTitle } from "~/server/queries/page";
import PageEditors from "./PageEditors";
import { auth } from "~/app/auth";
import { getUserTagTree } from "~/server/queries/usersTags";

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
      <PageEditors title={title} content={content} userTagTree={userTagTree} />
    </div>
  );
}
