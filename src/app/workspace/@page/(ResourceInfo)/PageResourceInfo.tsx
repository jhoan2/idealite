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
  backlinks: Array<{ id: string; title: string }>;
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
  backlinks,
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
      {backlinks.length > 0 && (
        <div className="mb-4 px-2 py-2 text-sm text-muted-foreground">
          <span className="font-medium">Backlinks ({backlinks.length}):</span>{" "}
          {backlinks.map((link, index) => (
            <span key={link.id}>
              {link.title}
              {index < backlinks.length - 1 ? ", " : ""}
            </span>
          ))}
        </div>
      )}
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
          metadata={resource.metadata as Record<string, any> | undefined}
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
