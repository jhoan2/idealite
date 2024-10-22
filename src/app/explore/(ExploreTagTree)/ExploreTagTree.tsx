"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronDown, Trash, Save } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { Button } from "~/components/ui/button";
import type { TreeNode } from "./buildUserTagTree";
import type { SelectTag } from "~/server/tagQueries";

interface ExploreTagTreeProps {
  tagTree: {
    id: string;
    name: string;
    children: {
      id: string;
      name: string;
      children: TreeNode[];
      parent_id: string | null;
    }[];
    parent_id: string | null;
  }[];
  flatUserTags: SelectTag[];
  setFlatUserTags: (tags: SelectTag[]) => void;
  hasChanged: boolean;
  handleSaveChanges: () => void;
  isSaving: boolean;
}

interface TreeNodeData {
  id: string;
  name: string;
  children?: TreeNodeData[];
  isInBoth?: boolean;
}

interface TreeProps {
  data: TreeNodeData;
  flatUserTags: SelectTag[];
  setFlatUserTags: (tags: SelectTag[]) => void;
  hasChanged: boolean;
  handleSaveChanges: () => void;
  isSaving: boolean;
}

const TreeNode: React.FC<{
  node: TreeNodeData;
  level: number;
  flatUserTags: SelectTag[];
  setFlatUserTags: (tags: SelectTag[]) => void;
  hasChanged: boolean;
  handleSaveChanges: () => void;
  isSaving: boolean;
}> = ({
  node,
  level,
  flatUserTags,
  setFlatUserTags,
  hasChanged,
  handleSaveChanges,
  isSaving,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  const handleDelete = (id: string) => {
    const updatedTags = flatUserTags.filter((tag) => tag.id !== id);
    setFlatUserTags(updatedTags);
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
            {hasChildren && (
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
            )}
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
                  flatUserTags={flatUserTags}
                  setFlatUserTags={setFlatUserTags}
                  hasChanged={hasChanged}
                  handleSaveChanges={handleSaveChanges}
                  isSaving={isSaving}
                />
              ))}
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem
          onSelect={() => handleDelete(node.id)}
          className="text-red-600"
        >
          <Trash className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

const MinimalistTree: React.FC<TreeProps> = ({
  data,
  flatUserTags,
  setFlatUserTags,
  hasChanged,
  handleSaveChanges,
  isSaving,
}) => {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {hasChanged && (
        <div className="mt-4 flex justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveChanges}
            disabled={isSaving}
          >
            {!isSaving && <Save className="mr-2 h-4 w-4" />}
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      )}
      <div className="custom-scrollbar h-screen overflow-y-auto p-4">
        <TreeNode
          node={data}
          level={0}
          flatUserTags={flatUserTags}
          setFlatUserTags={setFlatUserTags}
          hasChanged={hasChanged}
          handleSaveChanges={handleSaveChanges}
          isSaving={isSaving}
        />
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
  flatUserTags,
  setFlatUserTags,
  hasChanged,
  handleSaveChanges,
  isSaving,
}: ExploreTagTreeProps) {
  const data: TreeNodeData = tagTree[0] || { id: "", name: "" };
  return (
    <MinimalistTree
      data={data}
      flatUserTags={flatUserTags}
      setFlatUserTags={setFlatUserTags}
      hasChanged={hasChanged}
      handleSaveChanges={handleSaveChanges}
      isSaving={isSaving}
    />
  );
}
