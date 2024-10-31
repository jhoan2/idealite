import UserTagTree from "./(UserTagTree)/UserTagTree";
import { auth } from "~/app/auth";
import { getUserTagTree } from "~/server/queries/usersTags";
import { SidebarProvider } from "~/components/ui/sidebar";
import { RightSideBar } from "./(Page)/RightSideBar";
import PageTabs from "./(Page)/PageTabs";

export default async function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  const userTagTree = userId ? await getUserTagTree(userId) : [];

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
          <UserTagTree userTagTree={userTagTree} />{" "}
        </div>
        <div className="custom-scrollbar flex min-w-0 flex-1 flex-col overflow-y-auto">
          <div className="w-full">
            <PageTabs userTagTree={userTagTree} />
          </div>
        </div>
        <div>
          <RightSideBar />
        </div>
      </div>
    </SidebarProvider>
  );
}
