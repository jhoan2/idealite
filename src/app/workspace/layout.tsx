import { auth } from "~/app/auth";
import { getUserTagTree } from "~/server/queries/usersTags";
import { getTabs } from "~/server/queries/tabs";
import { TabBarWrapper } from "./TabBarWrapper";
import { SidebarProvider } from "~/components/ui/sidebar";
import { RightSideBar } from "./(Page)/RightSideBar";
import { headers } from "next/headers";
import { TagTreeContainer } from "./(TagTreeNav)/TagTreeContainer";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  const [userTagTree, userTabs] = await Promise.all([
    userId ? getUserTagTree(userId) : [],
    userId ? getTabs(userId).then((res) => res.data) : [],
  ]);
  const activeTabId = userTabs?.find((tab) => tab.is_active)?.id ?? null;
  const headersList = headers();
  const userAgent = headersList.get("user-agent");

  const isMobile = userAgent?.toLowerCase().includes("mobile");

  return (
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
          <TabBarWrapper
            tabs={userTabs ?? []}
            activeTabId={activeTabId ?? null}
          />
          <div className="w-full">{children}</div>
        </div>
        <div>
          <RightSideBar />
        </div>
      </div>
    </SidebarProvider>
  );
}
