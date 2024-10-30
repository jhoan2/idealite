import { MetadataDisplay } from "./MetadataDisplay";
import { TagList } from "./TagList";
import { Resource } from "~/server/queries/resource";
import { TreeTag } from "~/server/queries/usersTags";

interface PageMetadataProps {
  resources: Resource[];
  tags: Tag[];
  userTagTree: TreeTag[];
  currentPageId: string;
}

interface Tag {
  id: string;
  name: string;
}

const flattenTagTree = (tree: TreeTag[], existingTags: Tag[]): Tag[] => {
  const existingTagIds = new Set(existingTags.map((tag) => tag.id));

  const flatten = (node: TreeTag): Tag[] => {
    let result: Tag[] = [];

    // Only add the current tag if it's not in existingTags
    if (!existingTagIds.has(node.id)) {
      result.push({ id: node.id, name: node.name });
    }

    // Recursively flatten children
    if (node.children) {
      node.children.forEach((child) => {
        result = result.concat(flatten(child));
      });
    }

    return result;
  };

  return tree.reduce((acc, node) => acc.concat(flatten(node)), [] as Tag[]);
};

export default function PageMetadata({
  resources,
  tags,
  userTagTree,
  currentPageId,
}: PageMetadataProps) {
  const availableTags = flattenTagTree(userTagTree, tags);

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {resources.map((resource) => (
        <MetadataDisplay
          key={resource.id}
          type={resource.type}
          title={resource.title}
          image={resource.image || ""}
          description={resource.description || ""}
          url={resource.url}
          date_published={resource.date_published}
          author={resource.author || ""}
        />
      ))}
      <TagList
        tags={tags}
        availableTags={availableTags}
        currentPageId={currentPageId}
      />
    </div>
  );
}
