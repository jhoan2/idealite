import { MetadataDisplay, MetadataDisplayProps } from "./MetadataDisplay";
import { TagList } from "./MetadataTagsList";
import { Resource } from "~/server/queries/resource";

interface PageMetadataProps {
  resources: Resource[];
  tags: string[];
}

export default function PageMetadata({ resources, tags }: PageMetadataProps) {
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
      {/* <TagList tags={tags} /> */}
    </div>
  );
}
