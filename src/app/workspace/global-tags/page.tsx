import GlobalTagState from "./(GlobalTagTree)/GlobalTagState";
import { getTagWithChildren } from "~/server/queries/tag";
import { getUserTags } from "~/server/queries/usersTags";
import { GlobalTagsTour } from "./GlobalTagsTour";
import { MobileGlobalTagsTour } from "./MobileGlobalTagsTour";
import { headers } from "next/headers";
import { currentUser } from "@clerk/nextjs/server";

export default async function GlobalTagsPage() {
  const user = await currentUser();
  const userId = user?.externalId;
  const tag = await getTagWithChildren(
    process.env.NEXT_PUBLIC_ROOT_TAG_ID ?? "",
  );
  const userTags = await getUserTags(userId ?? "");
  const headersList = headers();
  const userAgent = headersList.get("user-agent");

  const isMobile = userAgent?.toLowerCase().includes("mobile");
  const isWarpcast = userAgent?.toLowerCase().includes("warpcast");
  return (
    <>
      {isMobile || isWarpcast ? (
        <MobileGlobalTagsTour>
          <GlobalTagState
            tag={tag}
            userTags={userTags}
            userId={userId ?? null}
          />
        </MobileGlobalTagsTour>
      ) : (
        <GlobalTagsTour>
          <GlobalTagState
            tag={tag}
            userTags={userTags}
            userId={userId ?? null}
          />
        </GlobalTagsTour>
      )}
    </>
  );
}
