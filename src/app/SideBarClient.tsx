// src/app/SideBarClient.tsx (Renamed from SideBar.tsx)
"use client";

import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "~/components/ui/sidebar";
import {
  Home,
  UserRound,
  Inbox,
  Bell,
  Folder,
  ChartNetwork,
  LibraryBig,
  Tag,
  Layers,
  LogIn,
  StickyNote,
  Map,
} from "lucide-react";
import { NavUser } from "./NavUser";
import { useUser, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { NavPinned } from "./NavPinned";
import { NavMain } from "./NavMain";
import { Navworkspace } from "./NavWorkspace";
import { getNotificationCounts } from "~/server/queries/notification";
import { usePathname } from "next/navigation";
import { Button } from "~/components/ui/button";
import { useState, useEffect, useTransition } from "react";
import type { PinnedPage } from "~/server/queries/pinnedPages";

const workspaceItems = [
  {
    title: "Workspace",
    url: null,
    icon: Folder,
    isActive: false,
    items: [
      {
        title: "Create Page",
        icon: StickyNote,
        url: null,
      },
      {
        title: "Create Memory Map",
        icon: Map,
        url: null,
      },
      {
        title: "All Pages",
        url: "/workspace/pages",
        icon: Layers,
      },
      {
        title: "Tags",
        url: "/workspace/global-tags",
        icon: Tag,
      },
      {
        title: "Resources",
        url: "/workspace/resources",
        icon: LibraryBig,
      },
      // {
      //   title: "Graph",
      //   url: "/workspace/projects/archived",
      //   icon: ChartNetwork,
      // },
    ],
  },
];

// Custom component for the Notifications item with notification badge
function NotificationsNavItem() {
  return (
    <>
      <Bell className="h-4 w-4" />
      <span>Notifications</span>
      <SignedIn>
        <NotificationCount />
      </SignedIn>
    </>
  );
}

// Component to show just the notification count badge
function NotificationCount() {
  const [counts, setCounts] = useState({
    unread: 0,
    read: 0,
    reversed: 0,
    expired: 0,
  });
  const [isPending, startTransition] = useTransition();
  const { isLoaded, isSignedIn } = useUser();

  const fetchCounts = () => {
    if (!isLoaded || !isSignedIn) return;

    startTransition(async () => {
      try {
        const result = await getNotificationCounts();
        setCounts(result);
      } catch (error) {
        console.error("Failed to fetch notification counts:", error);
      }
    });
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchCounts();
      const interval = setInterval(fetchCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || !isSignedIn || counts.unread === 0) {
    return null;
  }

  return (
    <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
      {counts.unread > 99 ? "99+" : counts.unread}
    </div>
  );
}

interface SideBarClientProps {
  initialPinnedPages: PinnedPage[];
}

export default function SideBarClient({
  initialPinnedPages,
}: SideBarClientProps) {
  const { user, isLoaded, isSignedIn } = useUser();
  const pathname = usePathname();

  if (
    pathname === "/" ||
    pathname.startsWith("/mobile") ||
    pathname === "/waitlist" ||
    pathname.startsWith("/landing")
  ) {
    return null;
  }

  // Split navigation items - Home goes first
  const topNavigationItems = [
    {
      title: "Home",
      url: "/home",
      icon: Home,
      isActive: pathname === "/",
    },
  ];

  // Review and Notifications go after workspace
  const bottomNavigationItems = [
    {
      title: "Review",
      url: "/review",
      icon: Inbox,
      isActive: pathname === "/inbox",
    },
    {
      title: "Notifications",
      url: "/notifications",
      icon: NotificationsNavItem,
      isActive: pathname === "/notifications",
      customContent: true,
    },
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarHeader className="h-16 border-b border-sidebar-border">
          {/* Show loading state while Clerk is loading */}
          {!isLoaded && (
            <div className="flex items-center space-x-2 p-2">
              <UserRound className="h-4 w-4 animate-pulse" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          )}

          {/* Show user info when signed in */}
          <SignedIn>
            {user && (
              <NavUser
                user={{
                  name:
                    user.fullName ||
                    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                    "User",
                  email: user.emailAddresses[0]?.emailAddress || "",
                  avatar: user.imageUrl || "",
                }}
              />
            )}
          </SignedIn>

          {/* Show sign-in button when signed out */}
          <SignedOut>
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center space-x-2">
                <UserRound className="h-4 w-4" />
                <span className="text-sm text-muted-foreground">
                  Not signed in
                </span>
              </div>
              <SignInButton mode="modal">
                <span className="ml-2 cursor-pointer rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                  <LogIn className="mr-1 inline h-4 w-4" />
                  Sign In
                </span>
              </SignInButton>
            </div>
          </SignedOut>
        </SidebarHeader>
        <SidebarGroup>
          {/* Home navigation */}
          <NavMain items={topNavigationItems} />

          {/* Workspace section */}
          <Navworkspace items={workspaceItems} />

          {/* Review and Notifications */}
          <NavMain items={bottomNavigationItems} />
        </SidebarGroup>
        <NavPinned initialPinnedPages={initialPinnedPages} />
        <SidebarFooter />
      </SidebarContent>
    </Sidebar>
  );
}
