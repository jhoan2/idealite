"use client";

import { useState } from "react";
import { CirclePlus } from "lucide-react";
import { Info } from "lucide-react";
import TagCrumbs from "~/app/workspace/(Page)/TagCrumbs";
import { Button } from "~/components/ui/button";
import { type Tag } from "~/server/db/schema";
import { SidebarTrigger } from "~/components/ui/sidebar";
import AddMetadata from "~/app/workspace/[pageId]/(AddResource)/AddMetadata";
import { usePathname } from "next/navigation";
import { TreeTag } from "~/server/queries/usersTags";
import { Resource } from "~/server/queries/resource";
import PageResourceInfo from "~/app/workspace/[pageId]/(ResourceInfo)/PageResourceInfo";

interface PageHeaderProps {
  tags: Tag[];
  userTagTree: TreeTag[];
  resources: Resource[];
}

export function PageHeader({ tags, userTagTree, resources }: PageHeaderProps) {
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);
  const [isAddMetadataOpen, setIsAddMetadataOpen] = useState(false);
  const pathname = usePathname();
  const currentPageId = pathname.split("/workspace/")[1];
  return (
    <div className="p-4">
      <div className="flex items-center justify-between pb-4">
        <div className="flex-1"></div>
        <div className="flex w-4/5 flex-1 justify-center">
          <TagCrumbs tags={tags} />
        </div>
        <div className="flex flex-1 items-center justify-end">
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
          <SidebarTrigger />
        </div>
      </div>
      <div>
        {isMetadataOpen && (
          <PageResourceInfo
            resources={resources}
            tags={tags}
            userTagTree={userTagTree}
            currentPageId={currentPageId || ""}
          />
        )}
      </div>
    </div>
  );
}
