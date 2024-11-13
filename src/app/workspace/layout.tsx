import { auth } from "~/app/auth";
import { getUserTagTree } from "~/server/queries/usersTags";
import TagTreeNav from "./(TagTreeNav)/TagTreeNav";
import { getTabs } from "~/server/queries/tabs";
import { TabBarWrapper } from "./TabBarWrapper";
import { SidebarProvider } from "~/components/ui/sidebar";
import { RightSideBar } from "./(Page)/RightSideBar";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  const userTagTree = userId ? await getUserTagTree(userId) : [];
  const userTabs = userId ? (await getTabs(userId)).data : [];
  const activeTabId = userTabs?.find((tab) => tab.is_active)?.id ?? null;

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "24rem",
        } as React.CSSProperties
      }
    >
      <div className="flex h-screen w-full overflow-hidden">
        <div>
          <TagTreeNav userTagTree={userTagTree} userId={userId ?? ""} />
        </div>
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
