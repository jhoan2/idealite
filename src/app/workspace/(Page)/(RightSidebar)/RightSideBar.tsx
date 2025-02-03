"use client";

import { useParams } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "~/components/ui/sidebar";

import { CardList } from "./CardList";
import { TreeTag } from "~/server/queries/usersTags";

export function RightSideBar({ userTagTree }: { userTagTree: TreeTag[] }) {
  const params = useParams();
  const pageId = params.pageId as string;

  return (
    <Sidebar side="right" variant="sidebar" collapsible="offcanvas">
      <SidebarHeader>
        <div className="p-4">
          <h2 className="text-lg font-semibold">Page Cards</h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <CardList pageId={pageId} userTagTree={userTagTree} />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
