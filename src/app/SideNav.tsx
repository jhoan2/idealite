"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Home,
  Folder,
  UserRound,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  MessageSquare,
} from "lucide-react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ModeToggle } from "./NextThemeButton";
import { NeynarAuthButton } from "@neynar/react";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";

export default function SideNav() {
  const pathname = usePathname();

  if (pathname.includes("/channelFrame") || pathname === "/") {
    return null;
  }

  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const menuItems = [
    { icon: Home, label: "Home", href: "/home" },
    { icon: Folder, label: "Workspace", href: "/workspace" },
    { icon: Gamepad2, label: "Play", href: "/play" },
    { icon: UserRound, label: "Profile", href: "/profile" },
  ];

  return (
    <nav
      className={`flex h-screen flex-col bg-background text-foreground transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"} rounded-r-xl border-r-2 border-border`}
    >
      <div className="flex items-center justify-between border-b bg-background p-4 text-foreground">
        <Link href="/">
          <div className="flex items-center space-x-2">
            <Image
              src="/icon48.png"
              alt="idealite logo"
              width={48}
              height={48}
              priority
            />
            {!isCollapsed && (
              <h1 className="text-xl font-semibold text-amber-400">Idealite</h1>
            )}
          </div>
        </Link>
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>
      <ScrollArea className="flex h-full flex-col justify-between">
        <nav className="space-y-4 p-2">
          {menuItems.map((item, index) => (
            <Link href={item.href} key={index}>
              <Button
                variant="ghost"
                className={clsx(
                  "w-full",
                  isCollapsed ? "px-2" : "justify-start px-4",
                  "bg-background hover:bg-gray-100 dark:hover:bg-gray-800",
                  {
                    "bg-gray-100 text-foreground dark:bg-gray-800":
                      pathname.includes(item.href),
                    "text-foreground": !pathname.includes(item.href),
                  },
                )}
              >
                <item.icon className="mr-2 h-6 w-6" />
                {!isCollapsed && <span>{item.label}</span>}
              </Button>
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <div className="flex flex-col items-center space-y-4 border-t bg-background p-4 text-foreground">
        {/* {!isCollapsed && <NeynarAuthButton />} */}
        <ModeToggle />
      </div>
    </nav>
  );
}
