import ExploreState from "./(ExploreTagTree)/ExploreState";
import { getTagWithChildren } from "~/server/tagQueries";
import { getUserTags } from "~/server/usersTagsQueries";
import { auth } from "~/app/auth";

export default async function Explore() {
  const session = await auth();
  const userId = session?.user?.id;

  const tag = await getTagWithChildren("5a6fa43e-7d62-4e3e-bc46-d0bd9c7997a3");
  const userTags = userId ? await getUserTags(userId) : [];
  return <ExploreState tag={tag} userTags={userTags} userId={userId ?? null} />;
}
