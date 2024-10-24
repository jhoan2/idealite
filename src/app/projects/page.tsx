import UserTagTree from "./(UserTagTree)/UserTagTree";
import { auth } from "~/app/auth";
import { getUserTagTree } from "~/server/queries/usersTags";

export default async function Projects() {
  const session = await auth();
  const userId = session?.user?.id;
  const userTagTree = userId ? await getUserTagTree(userId) : [];

  return <UserTagTree userTagTree={userTagTree} />;
}
