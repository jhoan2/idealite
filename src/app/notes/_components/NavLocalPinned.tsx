"use client";

import React from "react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import { Pin, FileText } from "lucide-react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "~/storage/db";
import { usePathname } from "next/navigation";

export function NavLocalPinned() {
  const pathname = usePathname();
  
  // Instant reactive read from local DB
  // We'll assume for now pinned state is in the page object or a separate table
  // For simplicity in this first draft, we'll fetch all pages marked as daily or recently updated
  const pinnedPages = useLiveQuery(
    () => db.pages.where('isDaily').equals(1).limit(5).toArray(),
    []
  );

  if (!pinnedPages || pinnedPages.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center gap-2">
        <Pin className="h-4 w-4" />
        Pinned
      </SidebarGroupLabel>
      <SidebarMenu>
        {pinnedPages.map((page) => {
          const isActive = pathname === `/notes/${page.id}`;
          return (
            <SidebarMenuItem key={page.id}>
              <SidebarMenuButton asChild isActive={isActive}>
                <Link href={`/notes/${page.id}`} className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="flex-1 truncate">{page.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
