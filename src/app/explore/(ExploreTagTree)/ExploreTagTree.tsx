"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronDown, Archive } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { toggleTagArchived } from "~/server/actions/usersTags";
import { toast } from "sonner";

interface ExploreTagTreeProps {
  tagTree: {
    id: string;
    name: string;
    children: {
      id: string;
      name: string;
      children: TreeNodeData[];
      parent_id: string | null;
    }[];
    parent_id: string | null;
  }[];
  userId: string | undefined;
}

interface TreeNodeData {
  id: string;
  name: string;
  children?: TreeNodeData[];
  isInBoth?: boolean;
  is_archived?: boolean;
}

interface TreeProps {
  data: TreeNodeData;
  userId: string | undefined;
}

const TreeNode: React.FC<{
  node: TreeNodeData;
  level: number;
  userId: string | undefined;
}> = ({ node, level, userId }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const handleArchive = async (id: string) => {
    try {
      const result = await toggleTagArchived({
        tagId: id,
        isArchived: true,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to archive tag");
      }
    } catch (error) {
      console.error("Error archiving tag:", error);
      toast.error("Failed to archive tag");
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className="select-none">
          <div
            className={`flex cursor-pointer items-center py-1 transition-colors duration-150 ease-in-out hover:bg-gray-50 dark:hover:bg-gray-700`}
            style={{ paddingLeft: `${level * 16}px` }}
            onClick={() => hasChildren && setIsExpanded(!isExpanded)}
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
          {isExpanded && hasChildren && (
            <div className="ml-2">
              {node.children!.map((child, index) => (
                <TreeNode
                  key={index}
                  node={child}
                  level={level + 1}
                  userId={userId}
                />
              ))}
            </div>
          )}
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-64">
        <ContextMenuItem onSelect={() => handleArchive(node.id)}>
          <Archive className="mr-2 h-4 w-4" />
          <span>Archive</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

const MinimalistTree: React.FC<TreeProps> = ({ data, userId }) => {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="custom-scrollbar h-screen overflow-y-auto p-4">
        <TreeNode node={data} level={0} userId={userId} />
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

export default function ExploreTagTree({
  tagTree,
  userId,
}: ExploreTagTreeProps) {
  const data: TreeNodeData = tagTree[0] || { id: "", name: "" };
  return <MinimalistTree data={data} userId={userId} />;
}
