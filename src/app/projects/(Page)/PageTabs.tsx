"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { X, Info, Loader2 } from "lucide-react";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { PageActions } from "./PageActions";
import { TagCrumbs } from "./TagCrumbs";
import PageMetadata from "./PageMetadata";
import { Button } from "~/components/ui/button";
import BodyEditor from "./BodyEditor";
import HeadingEditor from "./HeadingEditor";
import { TreeTag } from "~/server/queries/usersTags";

interface TabPage {
  id: string;
  title: string;
  content: string;
  isLoading: boolean;
}

export default function PageTabs({ userTagTree }: { userTagTree: TreeTag[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [openTabs, setOpenTabs] = useState<TabPage[]>([]);
  const currentPageId = pathname.split("/projects/")[1];
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);

  //Fixes the problem with refreshing on the page openTabs is empty, but url state is not.
  useEffect(() => {
    if (isInitialLoad && currentPageId) {
      fetchPageData(currentPageId, true);
      setIsInitialLoad(false);
    }
  }, [isInitialLoad, currentPageId]);

  useEffect(() => {
    if (
      !isInitialLoad &&
      currentPageId &&
      !openTabs.find((tab) => tab.id === currentPageId)
    ) {
      fetchPageData(currentPageId, false);
    }
  }, [currentPageId, isInitialLoad]);

  const fetchPageData = async (pageId: string, isInitial: boolean) => {
    setOpenTabs((prev) => {
      if (prev.find((tab) => tab.id === pageId)) return prev;
      return [
        ...prev,
        { id: pageId, title: "Loading...", content: "", isLoading: true },
      ];
    });

    try {
      const response = await fetch(`/api/pages?pageId=${pageId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const pageData = await response.json();

      if (pageData.error) {
        throw new Error(pageData.error);
      }

      setOpenTabs((prev) => {
        const filtered = prev.filter((tab) => tab.id !== pageId);
        return [
          ...filtered,
          {
            id: pageId,
            title: pageData.title,
            content: pageData.content || "<p></p>",
            isLoading: false,
          },
        ];
      });
    } catch (error) {
      console.error("Failed to fetch page data:", error);
      setOpenTabs((prev) => prev.filter((tab) => tab.id !== pageId));
      if (isInitial) router.push("/projects");
    }
  };

  return (
    <Tabs value={currentPageId} className="w-full">
      <TabsList className="flex items-center justify-between overflow-x-auto overflow-y-hidden">
        <div>
          {openTabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="group relative"
              onClick={() => router.push(`/projects/${tab.id}`)}
            >
              <span>{tab.title}</span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenTabs((prev) => prev.filter((t) => t.id !== tab.id));
                  if (tab.id === currentPageId) {
                    const remaining = openTabs.filter((t) => t.id !== tab.id);
                    if (remaining.length > 0) {
                      const lastTab = remaining[remaining.length - 1];
                      if (lastTab) {
                        router.push(`/projects/${lastTab.id}`);
                      }
                    } else {
                      router.push("/");
                    }
                  }
                }}
                className="ml-2 rounded-full p-1 opacity-0 group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </span>
            </TabsTrigger>
          ))}
        </div>
        <div className="flex items-center">
          <PageActions />
          <SidebarTrigger />
        </div>
      </TabsList>
      <div className="flex items-center justify-between pt-2">
        <div className="flex-1"></div>
        <div className="flex flex-1 justify-center">
          <TagCrumbs
            userTagTree={userTagTree}
            currentPageId={currentPageId || ""}
          />
        </div>
        <div className="flex flex-1 justify-end">
          <Button
            variant="ghost"
            onClick={() => setIsMetadataOpen(!isMetadataOpen)}
          >
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {isMetadataOpen && <PageMetadata />}
      {openTabs.map((tab) => (
        <TabsContent
          key={tab.id}
          value={tab.id}
          className="mt-10 flex h-full w-full flex-col justify-center"
        >
          {tab.isLoading ? (
            <div className="z-10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
          ) : (
            <>
              <HeadingEditor
                initialTitle={tab.title}
                pageId={tab.id}
                userTagTree={userTagTree}
              />
              <BodyEditor content={tab.content} />
            </>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
