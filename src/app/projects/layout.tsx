import UserTagTree from "./(UserTagTree)/UserTagTree";
import { auth } from "~/app/auth";
import { getUserTagTree } from "~/server/queries/usersTags";

export default async function UserTagTreeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  const userTagTree = userId ? await getUserTagTree(userId) : [];

  return (
    <div className="flex">
      <UserTagTree userTagTree={userTagTree} />
    </div>
  );
}
