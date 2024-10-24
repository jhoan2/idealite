"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronDown, Trash, StickyNote } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
import type { TreeTag } from "~/server/usersTagsQueries";
import { v4 as uuidv4 } from "uuid";
import { createPage } from "~/server/usersTagsActions";
interface TreeProps {
  data: TreeTag[];
}

const createUntitledPage = (node: TreeTag) => {
  // Get all untitled pages
  const untitledPages = node.pages.filter((page) =>
    page.title.toLowerCase().startsWith("untitled"),
  );

  // Create new page title using array length
  const newTitle =
    untitledPages.length === 0
      ? "untitled"
      : `untitled ${untitledPages.length}`;

  return {
    id: uuidv4(),
    title: newTitle,
    tag_id: node.id,
  };
};

const TreeNode: React.FC<{
  node: TreeTag;
  level: number;
}> = ({ node, level }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const hasPages = node.pages && node.pages.length > 0;
  const [isLoading, setIsLoading] = useState(false);

  const handleCreatePage = async () => {
    try {
      setIsLoading(true);
      const pageInput = createUntitledPage(node);
      const result = await createPage(pageInput);

      if (!result.success) {
        throw new Error("Failed to create page");
      }
    } catch (error) {
      console.error("Error creating page:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className="select-none">
          <div
            className={`flex cursor-pointer items-center py-1 transition-colors duration-150 ease-in-out hover:bg-gray-50 dark:hover:bg-gray-700`}
            style={{ paddingLeft: `${level * 16}px` }}
            onClick={() =>
              (hasChildren || hasPages) && setIsExpanded(!isExpanded)
            }
          >
            {
              <button
                className="mr-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-600"
                aria-expanded={isExpanded}
                aria-label={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                )}
              </button>
            }
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {node.name}
            </span>
          </div>
          {isExpanded && (
            <div className="ml-2">
              {hasChildren &&
                node.children!.map((child, index) => (
                  <TreeNode key={child.id} node={child} level={level + 1} />
                ))}
              {hasPages &&
                node.pages.map((page) => (
                  <div
                    key={page.id}
                    className="flex items-center py-1"
                    style={{ paddingLeft: `${(level + 1) * 16}px` }}
                  >
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {page.title}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem
          onSelect={handleCreatePage}
          disabled={isLoading}
          className={isLoading ? "cursor-not-allowed opacity-50" : ""}
        >
          <StickyNote className="mr-2 h-4 w-4" />
          <span>{isLoading ? "Creating..." : "Create a Page"}</span>
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => console.log(node)}
          className="text-red-600"
        >
          <Trash className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

const MinimalistTree: React.FC<TreeProps> = ({ data }) => {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="custom-scrollbar h-screen overflow-y-auto p-4">
        {data.map((node, index) => (
          <TreeNode key={index} node={node} level={0} />
        ))}
      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 4px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.7);
        }
        @media (prefers-color-scheme: dark) {
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(156, 163, 175, 0.3);
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: rgba(156, 163, 175, 0.5);
          }
        }
      `}</style>
    </div>
  );
};

export default function UserTagTree({
  userTagTree,
}: {
  userTagTree: TreeTag[];
}) {
  return <MinimalistTree data={userTagTree} />;
}
