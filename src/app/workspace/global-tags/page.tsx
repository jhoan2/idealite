import GlobalTagState from "./(GlobalTagTree)/GlobalTagState";
import { getTagWithChildren } from "~/server/queries/tag";
import { getUserTags } from "~/server/queries/usersTags";
import { auth } from "~/app/auth";
import { GlobalTagsTour } from "./GlobalTagsTour";
import { MobileGlobalTagsTour } from "./MobileGlobalTagsTour";
import { headers } from "next/headers";

export default async function GlobalTagsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const tag = await getTagWithChildren(
    process.env.NEXT_PUBLIC_ROOT_TAG_ID ?? "",
  );
  const userTags = await getUserTags(userId ?? "");
  const headersList = headers();
  const userAgent = headersList.get("user-agent");

  const isMobile = userAgent?.toLowerCase().includes("mobile");
  return (
    <>
      {isMobile ? (
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
