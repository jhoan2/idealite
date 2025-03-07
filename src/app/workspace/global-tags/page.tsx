import GlobalTagState from "./(GlobalTagTree)/GlobalTagState";
import { getTagWithChildren } from "~/server/queries/tag";
import { getUserTags } from "~/server/queries/usersTags";
import { auth } from "~/app/auth";

export default async function GlobalTagsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const tag = await getTagWithChildren(
    process.env.NEXT_PUBLIC_ROOT_TAG_ID ?? "",
  );
  const userTags = await getUserTags(userId ?? "");
  return (
    <GlobalTagState tag={tag} userTags={userTags} userId={userId ?? null} />
  );
}
