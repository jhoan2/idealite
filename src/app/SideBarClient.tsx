"use client";

import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "~/components/ui/sidebar";
import {
  Calendar,
  Search,
  Inbox,
  UserRound,
  LogIn,
} from "lucide-react";
import { NavUser } from "./NavUser";
import { useUser, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { NavMain } from "./NavMain";
import { usePathname } from "next/navigation";
import { useDailyNote } from "./notes/_hooks/useDailyNote";
import { NavLocalPinned } from "./notes/_components/NavLocalPinned";

interface SideBarClientProps {
  initialPinnedPages: any[]; // Kept for type compatibility, though unused now
}

export default function SideBarClient({
  initialPinnedPages,
}: SideBarClientProps) {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const { openDailyNote } = useDailyNote();

  // Hide sidebar on public/landing pages
  if (
    pathname === "/" ||
    pathname.startsWith("/mobile") ||
    pathname === "/waitlist" ||
    pathname.startsWith("/landing") ||
    pathname.startsWith("/blog")
  ) {
    return null;
  }

  const navItems = [
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
      customContent: true,
      isActive: false
    },
    {
      title: "Search",
      url: "#", // Will hook up to CMD+K modal later
      icon: Search,
      isActive: false
    },
    {
      title: "Review",
      url: "/review",
      icon: Inbox,
      isActive: pathname === "/review",
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 border-b border-sidebar-border">
        {/* Show loading state while Clerk is loading */}
        {!isLoaded && (
          <div className="flex items-center space-x-2 p-2">
            <UserRound className="h-4 w-4 animate-pulse" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        )}

        {/* Show sign-in button when signed out */}
        <SignedOut>
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center space-x-2">
              <UserRound className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">
                Guest
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
      
      <SidebarContent>
        <NavMain items={navItems} />
        
        {/* Local Pinned Pages (Reads from Dexie) */}
        <NavLocalPinned />
        
      </SidebarContent>

      <SidebarFooter>
        <SignedIn>
          {user && (
            <NavUser
              user={{
                name: user.fullName || "User",
                email: user.primaryEmailAddress?.emailAddress || "",
                avatar: user.imageUrl || "",
              }}
            />
          )}
        </SignedIn>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}