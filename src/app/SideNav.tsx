"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Home, Folder, UserRound, Gamepad2, Inbox } from "lucide-react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ModeToggle } from "./NextThemeButton";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { SignInButton, SignedOut, SignedIn, UserButton } from "@clerk/nextjs";

export default function SideNav() {
  const pathname = usePathname();

  const menuItems = [
    { icon: Home, label: "Home", href: "/home" },
    { icon: Folder, label: "Workspace", href: "/workspace" },
    { icon: Gamepad2, label: "Play", href: "/play" },
    { icon: UserRound, label: "Profile", href: "/profile" },
    { icon: Inbox, label: "Review", href: "/review" },
  ];

  return (
    <nav className="flex h-screen w-20 flex-col rounded-r-xl border-r-2 border-border bg-background text-foreground transition-all duration-300">
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
          </div>
        </Link>
      </div>
      <ScrollArea className="flex h-full flex-col justify-between">
        <nav className="space-y-4 p-2">
          {menuItems.map((item) => {
            const isActive = pathname.includes(item.href);
            return (
              <Link href={item.href} key={item.href}>
                <Button
                  variant="ghost"
                  title={item.label}
                  className={clsx(
                    "w-full justify-start bg-background px-4 hover:bg-gray-100 dark:hover:bg-gray-800",
                    {
                      "bg-gray-100 text-foreground dark:bg-gray-800": isActive,
                      "text-foreground": !isActive,
                    },
                  )}
                >
                  <item.icon className="mr-2 h-6 w-6" />
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="flex flex-col items-center justify-between space-y-4 border-t bg-background p-4 text-foreground">
        <SignedIn>
          <UserButton />
        </SignedIn>
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <ModeToggle />
      </div>
    </nav>
  );
}
