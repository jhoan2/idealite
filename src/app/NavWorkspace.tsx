"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "~/components/ui/sidebar";
import { Button } from "~/components/ui/button";

export function Navworkspace({
  items,
}: {
  items: {
    title: string;
    url?: string | null;
    icon: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string | null;
      icon?: LucideIcon;
    }[];
  }[];
}) {
  const router = useRouter();

  const handleCreateAction = async (
    itemTitle: string,
    type: "page" | "canvas",
  ) => {
    // Generate temporary ID for optimistic navigation
    const tempId = `temp-${uuidv4()}`;
    
    // Navigate immediately to optimistic page
    router.push(`/workspace?pageId=${tempId}&type=${type}`);
  };

  const isCreateButton = (title: string) => {
    return title === "Create Page" || title === "Create Memory Map";
  };

  const getCreateType = (title: string): "page" | "canvas" => {
    return title === "Create Page" ? "page" : "canvas";
  };

  return (
    <SidebarMenu>
      {items.map((item) => (
        <Collapsible key={item.title} asChild defaultOpen={item.isActive}>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={item.title}>
              {item.url ? (
                <a href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              ) : (
                <div className="flex cursor-default items-center gap-2">
                  <item.icon />
                  <span>{item.title}</span>
                </div>
              )}
            </SidebarMenuButton>
            {item.items?.length ? (
              <>
                <CollapsibleTrigger asChild>
                  <SidebarMenuAction className="data-[state=open]:rotate-90">
                    <ChevronRight />
                    <span className="sr-only">Toggle</span>
                  </SidebarMenuAction>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        {isCreateButton(subItem.title) ? (
                          <Button
                            variant="ghost"
                            className="h-8 w-full justify-start gap-2 px-2 text-sm font-normal"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleCreateAction(
                                subItem.title,
                                getCreateType(subItem.title),
                              );
                            }}
                          >
                            {subItem.icon && (
                              <subItem.icon className="h-4 w-4" />
                            )}
                            <span>{subItem.title}</span>
                          </Button>
                        ) : (
                          <SidebarMenuSubButton asChild>
                            <a href={subItem.url!}>
                              {subItem.icon && <subItem.icon />}
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        )}
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </>
            ) : null}
          </SidebarMenuItem>
        </Collapsible>
      ))}
    </SidebarMenu>
  );
}
