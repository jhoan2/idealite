import { getUserTagTree } from "~/server/queries/usersTags";
import { SidebarProvider } from "~/components/ui/sidebar";
import { RightSideBar } from "./(Page)/(RightSidebar)/RightSideBar";
import { headers } from "next/headers";
import { TagTreeContainer } from "./(TagTreeNav)/TagTreeContainer";
import { trackEvent } from "~/lib/posthog/server";
import { getUserDiscoveredFeatures } from "~/server/queries/featureDiscovery";
import { FeatureDiscoveryProvider } from "./(FeatureDiscover)/FeatureDiscoveryContext";
import { currentUser } from "@clerk/nextjs/server";
import { SidebarTrigger } from "~/components/ui/sidebar";
export default async function WorkspaceLayout({
  children,
  editor,
  tabs,
  page,
}: {
  children: React.ReactNode;
  editor: React.ReactNode;
  tabs: React.ReactNode;
  page: React.ReactNode;
}) {
  const user = await currentUser();
  const userId = user?.externalId;
  const [userTagTree, initialDiscoveredFeatures] = await Promise.all([
    userId ? getUserTagTree(userId) : [],
    userId ? getUserDiscoveredFeatures(userId) : [],
  ]);
  const headersList = headers();
  const userAgent = headersList.get("user-agent");

  const isMobile = userAgent?.toLowerCase().includes("mobile");

  if (userId) {
    trackEvent(Number(userId), "workspace_viewed", {
      username: user?.emailAddresses[0]?.emailAddress,
    });
  }

  return (
    <FeatureDiscoveryProvider
      userId={userId ?? ""}
      initialDiscoveredFeatures={initialDiscoveredFeatures}
    >
      <SidebarProvider
        style={
          {
            "--sidebar-width": "24rem",
          } as React.CSSProperties
        }
        defaultOpen={false}
      >
        <div className="flex h-screen w-full overflow-hidden">
          <TagTreeContainer
            userTagTree={userTagTree}
            userId={userId ?? ""}
            isMobile={isMobile ?? false}
          />
          <div className="custom-scrollbar flex min-w-0 flex-1 flex-col overflow-y-auto">
            {tabs}
            <div className="fixed right-8 top-4 z-50">
              <SidebarTrigger />
            </div>
            <div className="w-full">
              {page}
              {children}
            </div>
          </div>
          {editor}
          <div>
            <RightSideBar
              userTagTree={userTagTree}
              isMobile={isMobile ?? false}
            />
          </div>
        </div>
      </SidebarProvider>
    </FeatureDiscoveryProvider>
  );
}
