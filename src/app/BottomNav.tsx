"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Folder, UserRound, Gamepad2 } from "lucide-react";
import { Button } from "~/components/ui/button";

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname.includes("/channelFrame") || pathname === "/") {
    return null;
  }

  const menuItems = [
    { icon: Home, label: "Home", href: "/home" },
    { icon: Folder, label: "Workspace", href: "/workspace" },
    { icon: Gamepad2, label: "Play", href: "/play" },
    { icon: UserRound, label: "Profile", href: "/profile" },
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
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </Button>
          </Link>
        ))}
      </div>
    </nav>
  );
}
