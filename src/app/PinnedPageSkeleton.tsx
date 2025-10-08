// src/app/PinnedPageSkeleton.tsx
import React from "react";
import { SidebarMenuButton, SidebarMenuItem } from "~/components/ui/sidebar";
import { Skeleton } from "~/components/ui/skeleton";

interface PinnedPageSkeletonProps {
  delay?: number;
}

export function PinnedPageSkeleton({ delay = 0 }: PinnedPageSkeletonProps) {
  return (
    <SidebarMenuItem
      className="group relative"
      style={{ animationDelay: `${delay}ms` }}
    >
      <SidebarMenuButton className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 max-w-[120px] flex-1 rounded" />
      </SidebarMenuButton>
      <div className="absolute right-1 top-1/2 -translate-y-1/2 p-1 opacity-30">
        <Skeleton className="h-3 w-3 rounded" />
      </div>
    </SidebarMenuItem>
  );
}
