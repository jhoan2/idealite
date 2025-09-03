"use client";

import { useSearchParams } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "~/components/ui/sidebar";
import { useEffect, useState } from "react";
import { CardList } from "./CardList";
import { TreeTag } from "~/server/queries/usersTags";
import { getPageType } from "~/server/queries/page";
import { ImageGenerator } from "./ImageGenerator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";

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

  const isCanvas = pageType === "canvas";

  useEffect(() => {
    if (pageId) {
      // Skip query for temporary/optimistic page IDs
      if (pageId.startsWith("temp-")) {
        setPageType("page"); // Default to "page" for new optimistic pages
        return;
      }
      
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
        {isCanvas && (
          <Tabs
            value={activeView}
            onValueChange={(val) =>
              setActiveView(val as "cards" | "image-generator")
            }
            className="pl-4 pt-1"
          >
            <TabsList>
              <TabsTrigger value="cards">Page Cards</TabsTrigger>
              <TabsTrigger value="image-generator">Image Generator</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </SidebarHeader>

      {activeView === "cards" ? (
        <SidebarContent>
          <CardList
            pageId={pageId}
            userTagTree={userTagTree}
            isMobile={isMobile}
          />
        </SidebarContent>
      ) : (
        <div className="flex-1 overflow-hidden">
          <div className="h-full px-4 py-2">
            <ImageGenerator />
          </div>
        </div>
      )}

      <SidebarFooter />
    </Sidebar>
  );
}
