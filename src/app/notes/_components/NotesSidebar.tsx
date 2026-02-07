"use client";

import * as React from "react";
import {
  Calendar,
  Search,
  Settings,
  Plus,
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

  const navMain = [
    {
      title: "Daily Note",
      url: "#",
      icon: Calendar,
      isActive: true,
      // We'll wrap this in a custom click handler in a real impl
    },
    {
      title: "Search",
      url: "#",
      icon: Search,
    },
  ];

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
        {/* Custom Daily Note trigger using NavMain pattern */}
        <NavMain items={[
          {
            title: "Daily Note",
            url: "#",
            icon: () => (
              <button 
                onClick={openDailyNote} 
                className="flex w-full items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                <span>Daily Note</span>
              </button>
            ),
            customContent: true
          },
          {
            title: "Search",
            url: "#",
            icon: Search,
          },
          {
            title: "Review",
            url: "/review",
            icon: Inbox,
          }
        ]} />
        
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
