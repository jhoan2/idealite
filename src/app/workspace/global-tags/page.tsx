// src/app/workspace/global-tags/page.tsx
import GlobalTagState from "./(GlobalTagTree)/GlobalTagState";
import { getTagWithChildren } from "~/server/queries/tag";
import {
  getUserTags,
  getUserTagTreeTagsOnly,
} from "~/server/queries/usersTags";
import { GlobalTagsTour } from "./GlobalTagsTour";
import { MobileGlobalTagsTour } from "./MobileGlobalTagsTour";
import { headers } from "next/headers";
import { currentUser } from "@clerk/nextjs/server";
import TagOnlyTreeNav from "../(TagTreeNav)/TagOnlyTreeNav";
import { MobileTagNavToggle } from "./MobileTagNavToggle";

export default async function GlobalTagsPage() {
  const user = await currentUser();
  const userId = user?.externalId;

  // Get both the hierarchical tag tree for the tree nav and the flat tags for the circle pack
  const [tag, userTags, userTagTree] = await Promise.all([
    getTagWithChildren(process.env.NEXT_PUBLIC_ROOT_TAG_ID ?? ""),
    getUserTags(userId ?? ""),
    getUserTagTreeTagsOnly(userId ?? ""),
  ]);

  const headersList = headers();
  const userAgent = headersList.get("user-agent");

  const isMobile = userAgent?.toLowerCase().includes("mobile");
  const isWarpcast = userAgent?.toLowerCase().includes("warpcast");

  return (
    <>
      {isMobile || isWarpcast ? (
        <MobileGlobalTagsTour>
          <div className="relative h-screen">
            {/* Full height for GlobalTagState */}
            <GlobalTagState
              tag={tag}
              userTags={userTags}
              userId={userId ?? null}
            />

            {/* Floating toggle button - top right */}
            <MobileTagNavToggle
              userTagTree={userTagTree}
              userId={userId ?? ""}
            />
          </div>
        </MobileGlobalTagsTour>
      ) : (
        <GlobalTagsTour>
          <div className="flex h-screen">
            {/* Desktop: Side by side */}
            <div className="w-80 border-r border-border">
              <TagOnlyTreeNav
                userTagTree={userTagTree}
                userId={userId ?? ""}
                isMobile={false}
              />
            </div>
            <div className="flex-1">
              <GlobalTagState
                tag={tag}
                userTags={userTags}
                userId={userId ?? null}
              />
            </div>
          </div>
        </GlobalTagsTour>
      )}
    </>
  );
}
