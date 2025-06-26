"use client";

import { useState } from "react";
import { CirclePlus } from "lucide-react";
import { Info } from "lucide-react";
import { Button } from "~/components/ui/button";
import { type Tag } from "~/server/db/schema";
import { usePathname } from "next/navigation";
import { TreeTag } from "~/server/queries/usersTags";
import AddMetadata from "../@page/(AddResource)/AddMetadata";
import { Resource } from "~/server/queries/resource";
import PageResourceInfo from "../@page/(ResourceInfo)/PageResourceInfo";
import TagCrumbs from "./TagCrumbs";

interface PageHeaderProps {
  tags: Tag[];
  userTagTree: TreeTag[];
  resources: Resource[];
  isMobile: boolean;
  isWarpcast: boolean;
}

export function PageHeader({
  tags,
  userTagTree,
  resources,
  isMobile,
  isWarpcast,
}: PageHeaderProps) {
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);
  const [isAddMetadataOpen, setIsAddMetadataOpen] = useState(false);
  const pathname = usePathname();
  const currentPageId = pathname.split("/workspace/")[1];

  return (
    <div className="p-4">
      <div className="flex items-center justify-between pb-4">
        <div className="flex-1"></div>
        <div className="flex w-4/5 flex-1 justify-center">
          {isMobile || isWarpcast ? null : <TagCrumbs tags={tags} />}
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
        </div>
      </div>
      <div>
        {isMetadataOpen && (
          <PageResourceInfo
            resources={resources}
            tags={tags}
            userTagTree={userTagTree}
            currentPageId={currentPageId || ""}
            isMobile={isMobile}
          />
        )}
      </div>
    </div>
  );
}
