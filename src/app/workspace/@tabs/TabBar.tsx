"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { ScrollArea, ScrollBar } from "~/components/ui/scroll-area";
import Link from "next/link";
interface Tab {
  id: string;
  title: string;
  path: string;
}

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string | null;
  onTabClose: (tabId: string) => void;
}

export function TabBar({ tabs, activeTabId, onTabClose }: TabBarProps) {
  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="block border-b">
      <ScrollArea className="w-full" type="scroll">
        <div className="flex h-11 items-center">
          {tabs.map((tab, index) => (
            <React.Fragment key={tab.id}>
              <div
                className={cn(
                  "group relative flex h-11 min-w-[120px] max-w-[200px] items-center justify-between gap-2 border-r px-4 text-sm",
                  activeTabId === tab.id &&
                    "bg-background before:absolute before:bottom-0 before:left-0 before:right-0 before:h-0.5 before:bg-primary",
                  activeTabId !== tab.id && "hover:bg-accent",
                )}
              >
                <Link
                  href={`/workspace/${tab.path}?tabId=${tab.id}`}
                  prefetch={true}
                  className="flex-1 truncate text-left"
                  title={tab.title}
                >
                  {tab.title.slice(0, 10) +
                    (tab.title.length > 10 ? "..." : "")}
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {index < tabs.length - 1 && (
                <Separator orientation="vertical" className="h-5" />
              )}
            </React.Fragment>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  );
}
