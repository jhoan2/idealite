"use client";

import { TagList } from "../TagList";
import { Resource } from "~/server/queries/resource";
import { TreeTag } from "~/server/queries/usersTags";
import InfoCard from "../(ResourceInfo)/InfoCard";
import { deleteResourcePage } from "~/server/actions/pagesResource";
import { deleteUserResource } from "~/server/actions/usersResource";
import { toast } from "sonner";
import { flattenTagTree } from "~/lib/tree";

interface PageResourceInfoProps {
  resources: Resource[];
  tags: Tag[];
  userTagTree: TreeTag[];
  currentPageId: string;
  isMobile: boolean;
}

interface Tag {
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date | null;
  parent_id: string | null;
  deleted: boolean | null;
  is_template: boolean;
  embedding: number[] | null;
}

export default function PageResourceInfo({
  resources,
  tags,
  userTagTree,
  currentPageId,
  isMobile,
}: PageResourceInfoProps) {
  const availableTags = flattenTagTree(userTagTree, tags);

  const handleDeleteResource = async (resourceId: string, pageId: string) => {
    try {
      await deleteResourcePage({ resourceId, pageId });

      await deleteUserResource({ resourceId });
    } catch (error) {
      console.error("Error deleting resource:", error);
      toast.error("Failed to delete resource");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {resources.map((resource) => (
        <InfoCard
          key={resource.id}
          type={resource.type}
          title={resource.title}
          image={resource.image || ""}
          description={resource.description || ""}
          url={resource.url}
          date_published={resource.date_published}
          author={resource.author || ""}
          resourceId={resource.id}
          pageId={currentPageId}
          onDelete={handleDeleteResource}
        />
      ))}
      <TagList
        tags={tags}
        availableTags={availableTags}
        currentPageId={currentPageId}
        isMobile={isMobile}
      />
    </div>
  );
}
