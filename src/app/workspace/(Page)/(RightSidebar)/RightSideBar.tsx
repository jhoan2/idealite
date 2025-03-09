"use client";

import { useSearchParams } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "~/components/ui/sidebar";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { ImageIcon, WalletCards } from "lucide-react";
import { CardList } from "./CardList";
import { TreeTag } from "~/server/queries/usersTags";
import { getPageType } from "~/server/queries/page";
import { MemoryPalace } from "./MemoryPalace";

export function RightSideBar({
  userTagTree,
  isMobile,
}: {
  userTagTree: TreeTag[];
  isMobile: boolean;
}) {
  const searchParams = useSearchParams();
  const pageId = searchParams.get("pageId") as string;
  const [pageType, setPageType] = useState<"page" | "canvas" | null>(null);
  const [activeView, setActiveView] = useState<"cards" | "image-generator">(
    "cards",
  );

  useEffect(() => {
    if (pageId) {
      getPageType(pageId).then((type) => {
        setPageType(type);
      });
    }
  }, [pageId]);

  const toggleView = () => {
    setActiveView(activeView === "cards" ? "image-generator" : "cards");
  };
  return (
    <Sidebar side="right" variant="sidebar" collapsible="offcanvas">
      <SidebarHeader>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {activeView === "cards" ? (
                <div className="flex items-center gap-2">
                  <WalletCards size={16} />
                  Page Cards
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <ImageIcon size={16} />
                  Image Generator
                </div>
              )}
            </h2>
            {pageType === "canvas" && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleView}
                title={
                  activeView === "cards"
                    ? "Switch to Image Generator"
                    : "Switch to Cards"
                }
              >
                {activeView === "cards" ? (
                  <ImageIcon size={16} />
                ) : (
                  <WalletCards size={16} />
                )}
              </Button>
            )}
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {activeView === "cards" ? (
          <CardList
            pageId={pageId}
            userTagTree={userTagTree}
            isMobile={isMobile}
          />
        ) : (
          <MemoryPalace />
        )}
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
