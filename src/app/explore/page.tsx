import ExploreState from "./(ExploreTagTree)/ExploreState";
import { getTagWithChildren } from "~/server/queries/tag";
import { getUserTags } from "~/server/queries/usersTags";
import { auth } from "~/app/auth";

export default async function Explore() {
  const session = await auth();
  const userId = session?.user?.id;

  const tag = await getTagWithChildren(
    process.env.NEXT_PUBLIC_ROOT_TAG_ID ?? "",
  );
  const userTags = userId ? await getUserTags(userId) : [];
  return <ExploreState tag={tag} userTags={userTags} userId={userId ?? null} />;
}
