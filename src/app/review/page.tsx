import { currentUser } from "@clerk/nextjs/server";
import CardsDue from "./CardsDue";
import { getUserTags } from "~/server/queries/usersTags";

export default async function ReviewPage() {
  const user = await currentUser();
  const userId = user?.externalId;
  if (!userId) {
    return <div>Not signed in</div>;
  }

  const allUserTags = await getUserTags(userId);
  const userTags = allUserTags.filter(
    (tag) => tag.id !== process.env.ROOT_TAG_ID,
  );

  return (
    <div className="container mx-auto h-full p-6">
      <CardsDue tags={userTags} />
    </div>
  );
}
