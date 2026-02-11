"use client";

import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
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
import { NavMain, type NavMainItem } from "./NavMain";
import { usePathname } from "next/navigation";
import { useDailyNote } from "./notes/_hooks/useDailyNote";
import { NavLocalPinned } from "./notes/_components/NavLocalPinned";
import { SearchModal } from "./notes/_components/SearchModal";
import { useGlobalSearch } from "./notes/_hooks/useGlobalSearch";
import { SyncStatus } from "./notes/_components/SyncStatus";

interface SideBarClientProps {
  initialPinnedPages: unknown[];
}

export default function SideBarClient({
  initialPinnedPages: _initialPinnedPages,
}: SideBarClientProps) {
  const { user, isLoaded } = useUser();
  const { state, isMobile } = useSidebar();
  const pathname = usePathname();
  const { openDailyNote } = useDailyNote();
  const { isSearchOpen, setSearchOpen } = useGlobalSearch();
  const isCollapsedDesktop = state === "collapsed" && !isMobile;

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

  const navItems: NavMainItem[] = [
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
      onClick: () => setSearchOpen(true),
      rightSlot: (
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          Ctrl+K
        </kbd>
      ),
    },
    {
      title: "All Notes",
      href: "/notes/all",
      icon: Layers,
      isActive: pathname === "/notes/all",
    },
    {
      title: "Review",
      href: "/review",
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
              <span className="text-sm text-muted-foreground group-data-[collapsible=icon]:hidden">
                Loading...
              </span>
            </div>
          )}

          <SignedOut>
            {isCollapsedDesktop ? (
              <div className="flex items-center justify-center p-2">
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <LogIn className="h-4 w-4" />
                    <span className="sr-only">Sign in</span>
                  </button>
                </SignInButton>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2">
                <div className="flex items-center space-x-2">
                  <UserRound className="h-4 w-4" />
                  <span className="text-sm text-muted-foreground">Guest</span>
                </div>
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="ml-2 inline-flex cursor-pointer items-center rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <LogIn className="mr-1 inline h-4 w-4" />
                    Sign In
                  </button>
                </SignInButton>
              </div>
            )}
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
                  name: user.fullName ?? "User",
                  email: user.primaryEmailAddress?.emailAddress ?? "",
                  avatar: user.imageUrl ?? "",
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
