import { ChevronRight, MoreHorizontal } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import React from "react";
import { type Tag } from "~/server/db/schema";

interface TagCrumbsProps {
  tags: Tag[];
}

export default function TagCrumbs({ tags }: TagCrumbsProps) {
  if (!tags || tags.length === 0) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Workspace</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }
  // Get last two tags
  const lastTwoTags = tags.slice(-2);
  const hasMoreTags = tags.length > 2;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/workspace">Workspace</BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator>
          <ChevronRight className="h-4 w-4" />
        </BreadcrumbSeparator>

        {hasMoreTags && (
          <>
            <BreadcrumbItem>
              <MoreHorizontal className="h-4 w-4" />
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
          </>
        )}

        {lastTwoTags.map((tag, index) => (
          <React.Fragment key={tag.id}>
            {index > 0 && (
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
            )}
            <BreadcrumbItem>
              {index === lastTwoTags.length - 1 ? (
                <BreadcrumbPage>{tag.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={`/workspace`}>{tag.name}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
