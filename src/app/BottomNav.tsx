"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Folder, UserRound, Inbox, Bell } from "lucide-react";
import { Button } from "~/components/ui/button";
import { NotificationBadge } from "~/app/NotificationBadge";

export default function BottomNav() {
  const pathname = usePathname();

  if (
    pathname.includes("/channelFrame") ||
    pathname === "/" ||
    pathname.includes("/mobile")
  ) {
    return null;
  }

  const menuItems = [
    { icon: Home, label: "Home", href: "/home" },
    { icon: Folder, label: "Workspace", href: "/workspace" },
    { icon: Inbox, label: "Review", href: "/review" },
    { icon: UserRound, label: "Profile", href: "/profile" },
    { icon: Bell, label: "Notifications", href: "/notifications" },
  ];

  return (
    <nav className="pb-safe fixed bottom-0 left-0 right-0 z-50 block border-t bg-background md:hidden">
      <div className="px-safe flex h-16 items-center justify-around">
        {menuItems.map((item, index) => (
          <Link href={item.href} key={index} className="w-full">
            <Button
              variant="ghost"
              className={`h-16 w-full flex-col gap-1 rounded-none ${
                pathname.includes(item.href)
                  ? "bg-accent"
                  : "hover:bg-accent/50"
              }`}
            >
              {item.href === "/notifications" ? (
                <NotificationBadge className="h-5 w-5" />
              ) : (
                <item.icon className="h-5 w-5" />
              )}
              <span className="text-[10px]">{item.label}</span>
            </Button>
          </Link>
        ))}
      </div>
    </nav>
  );
}
