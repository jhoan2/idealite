"use client";

import * as React from "react";
import {
  Calendar,
  Search,
  Inbox,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "~/components/ui/sidebar";
import { NavMain } from "~/app/NavMain";
import { NavUser } from "~/app/NavUser";
import { NavLocalPinned } from "./NavLocalPinned";
import { useDailyNote } from "../_hooks/useDailyNote";
import { useUser } from "@clerk/nextjs";

export function NotesSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { openDailyNote } = useDailyNote();
  const { user } = useUser();

  const userData = {
    name: user?.fullName ?? "User",
    email: user?.primaryEmailAddress?.emailAddress ?? "",
    avatar: user?.imageUrl ?? "",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {/* We can put a Logo or workspace switcher here later */}
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={[
            {
              title: "Daily Note",
              icon: Calendar,
              onClick: () => {
                void openDailyNote();
              },
            },
            {
              title: "Search",
              icon: Search,
              href: "#",
            },
            {
              title: "Review",
              icon: Inbox,
              href: "/review",
            },
          ]}
        />

        <NavLocalPinned />

        {/* We will add NavLocalTree here next */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
