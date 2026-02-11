"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { type LucideIcon } from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";

export type NavMainItem = {
  title: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  isActive?: boolean;
  rightSlot?: ReactNode;
};

export function NavMain({
  items,
}: {
  items: NavMainItem[];
}) {
  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild isActive={item.isActive} tooltip={item.title}>
            {item.href ? (
              <Link href={item.href} className="flex w-full min-w-0 items-center gap-2">
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="truncate group-data-[collapsible=icon]:hidden">
                  {item.title}
                </span>
                {item.rightSlot ? (
                  <span className="ml-auto group-data-[collapsible=icon]:hidden">
                    {item.rightSlot}
                  </span>
                ) : null}
              </Link>
            ) : (
              <button
                type="button"
                onClick={item.onClick}
                className="flex w-full min-w-0 items-center gap-2"
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="truncate group-data-[collapsible=icon]:hidden">
                  {item.title}
                </span>
                {item.rightSlot ? (
                  <span className="ml-auto group-data-[collapsible=icon]:hidden">
                    {item.rightSlot}
                  </span>
                ) : null}
              </button>
            )}
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
