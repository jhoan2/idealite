import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { TreeTag } from "~/server/queries/usersTags";
import { Fragment } from "react";
export function TagCrumbs({
  userTagTree,
  currentPageId,
}: {
  userTagTree: TreeTag[];
  currentPageId: string;
}) {
  const MAX_TAGS_IN_PATH = 2;
  function getTagPathForPage(tree: TreeTag[], pageId: string): string[] | null {
    function findPath(
      node: TreeTag,
      targetId: string,
      currentPath: string[],
    ): string[] | null {
      // Check if the page exists in current node's pages
      const pageExists = node.pages.some((page) => page.id === targetId);
      if (pageExists) {
        return [...currentPath, node.name];
      }

      // Recursively search through children
      for (const child of node.children) {
        const pathInChild = findPath(child, targetId, [
          ...currentPath,
          node.name,
        ]);
        if (pathInChild) {
          return pathInChild;
        }
      }

      return null;
    }

    // Search through all root level tags
    for (const rootTag of tree) {
      const path = findPath(rootTag, pageId, []);
      if (path) {
        return path;
      }
    }

    return null;
  }

  const tagPath = currentPageId
    ? getTagPathForPage(userTagTree, currentPageId)
    : null;

  const truncatedPath = tagPath?.slice(-MAX_TAGS_IN_PATH);
  const isPathTruncated = tagPath && tagPath.length > MAX_TAGS_IN_PATH;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/projects">Projects</BreadcrumbLink>
        </BreadcrumbItem>
        {isPathTruncated && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>...</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
        {truncatedPath?.map((tag, index) => (
          <Fragment key={index}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {index === truncatedPath.length - 1 ? (
                <BreadcrumbPage>{tag}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={`/projects/${tag}`}>{tag}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
