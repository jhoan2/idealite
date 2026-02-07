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
  Layers,
} from "lucide-react";
import { NavUser } from "./NavUser";
import { useUser, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { NavMain } from "./NavMain";
import { usePathname } from "next/navigation";
import { useDailyNote } from "./notes/_hooks/useDailyNote";
import { NavLocalPinned } from "./notes/_components/NavLocalPinned";
import { SearchModal } from "./notes/_components/SearchModal";
import { useGlobalSearch } from "./notes/_hooks/useGlobalSearch";
import { SyncStatus } from "./notes/_components/SyncStatus";

interface SideBarClientProps {
  initialPinnedPages: any[]; 
}

export default function SideBarClient({
  initialPinnedPages,
}: SideBarClientProps) {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const { openDailyNote } = useDailyNote();
  const { isSearchOpen, setSearchOpen } = useGlobalSearch();

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
      url: "#",
      icon: () => (
        <button 
          onClick={() => setSearchOpen(true)} 
          className="flex w-full items-center gap-2"
        >
          <Search className="h-4 w-4" />
          <span>Search</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      ),
      customContent: true,
      isActive: false
    },
    {
      title: "All Notes",
      url: "/notes/all",
      icon: Layers,
      isActive: pathname === "/notes/all",
    },
    {
      title: "Review",
      url: "/review",
      icon: Inbox,
      isActive: pathname === "/review",
    },
  ];

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="h-16 border-b border-sidebar-border">
          {!isLoaded && (
            <div className="flex items-center space-x-2 p-2">
              <UserRound className="h-4 w-4 animate-pulse" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          )}

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
          <NavLocalPinned />
          <div className="mt-auto pb-4">
            <SyncStatus />
          </div>
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

      {/* Global Search Modal */}
      <SearchModal open={isSearchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
