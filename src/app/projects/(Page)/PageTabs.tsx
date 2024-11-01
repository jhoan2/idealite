"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { X, Info, Loader2, CirclePlus } from "lucide-react";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { PageActions } from "./PageActions";
import { TagCrumbs } from "./TagCrumbs";
import PageMetadata from "./(ResourceInfo)/PageMetadata";
import { Button } from "~/components/ui/button";
import BodyEditor from "./BodyEditor";
import HeadingEditor from "./HeadingEditor";
import { TreeTag } from "~/server/queries/usersTags";
import AddMetadata from "./(AddResource)/AddMetadata";
import { Resource } from "~/server/queries/resource";
import { getPageForUser } from "~/server/queries/page";

interface TabPage {
  id: string;
  title: string;
  content: string;
  isLoading: boolean;
  resources: Resource[];
  tags: Tag[];
}

interface Tag {
  id: string;
  name: string;
}

export default function PageTabs({ userTagTree }: { userTagTree: TreeTag[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [openTabs, setOpenTabs] = useState<TabPage[]>([]);
  const currentPageId = pathname.split("/projects/")[1];
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);
  const [isAddMetadataOpen, setIsAddMetadataOpen] = useState(false);

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
        {
          id: pageId,
          title: "Loading...",
          content: "",
          isLoading: true,
          resources: [],
          tags: [],
        },
      ];
    });

    try {
      const pageData = await getPageForUser(pageId);

      if (!pageData) {
        throw new Error("Page not found");
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
            resources: pageData.resources as Resource[],
            tags: pageData.tags as Tag[],
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
          {isMetadataOpen && (
            <>
              <Button
                variant="ghost"
                onClick={() => setIsAddMetadataOpen(true)}
                title="Add metadata"
              >
                <CirclePlus className="h-4 w-4" />
              </Button>
              <AddMetadata
                isOpen={isAddMetadataOpen}
                onOpenChange={setIsAddMetadataOpen}
                pageId={currentPageId || ""}
              />
            </>
          )}
          <Button
            variant="ghost"
            onClick={() => setIsMetadataOpen(!isMetadataOpen)}
            title="Metadata tab"
          >
            <Info className="h-4 w-4" aria-label="Metadata tab" />
          </Button>
        </div>
      </div>
      {isMetadataOpen && (
        <PageMetadata
          resources={
            openTabs.find((tab) => tab.id === currentPageId)?.resources || []
          }
          tags={openTabs.find((tab) => tab.id === currentPageId)?.tags || []}
          userTagTree={userTagTree}
          currentPageId={currentPageId || ""}
        />
      )}

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
