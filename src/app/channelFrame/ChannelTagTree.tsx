"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronDown, Save } from "lucide-react";
import { Button } from "~/components/ui/button";
import type { TreeNode } from "../explore/(ExploreTagTree)/buildUserTagTree";
import type { SelectTag } from "~/server/queries/tag";

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
  goToNextStep: () => void;
  saveSuccess: boolean;
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
  saveSuccess: boolean;
  goToNextStep: () => void;
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
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const handleRowClick = () => {
    // If tag is already in flatUserTags, remove it
    if (flatUserTags.some((tag) => tag.id === node.id)) {
      setFlatUserTags(flatUserTags.filter((tag) => tag.id !== node.id));
    } else {
      // If tag is not in flatUserTags, add it
      setFlatUserTags([...flatUserTags, node as SelectTag]);
    }
  };

  const isSelected = flatUserTags.some((tag) => tag.id === node.id);

  return (
    <div className="select-none">
      <div
        className={`flex cursor-pointer items-center py-1 transition-colors duration-150 ease-in-out ${
          isSelected
            ? "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50"
            : "hover:bg-gray-50 dark:hover:bg-gray-700"
        }`}
        style={{ paddingLeft: `${level * 16}px` }}
        onClick={handleRowClick}
      >
        {
          <button
            className="mr-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-600"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse" : "Expand"}
            onClick={() => hasChildren && setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            ) : (
              <ChevronRight className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            )}
          </button>
        }
        <span className="text-lg text-gray-700 dark:text-gray-300">
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
  );
};

const MinimalistTree: React.FC<TreeProps> = ({
  data,
  flatUserTags,
  setFlatUserTags,
  hasChanged,
  handleSaveChanges,
  isSaving,
  saveSuccess,
  goToNextStep,
}) => {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {(hasChanged || saveSuccess) && (
        <div className="mt-4 flex justify-center space-x-2">
          {hasChanged && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveChanges}
              disabled={isSaving}
            >
              {!isSaving && <Save className="mr-2 h-4 w-4" />}
              {isSaving ? "Saving..." : "Save"}
            </Button>
          )}
          {saveSuccess && !hasChanged && (
            <Button
              className="w-full rounded-full bg-primary py-4 text-primary-foreground"
              onClick={goToNextStep}
            >
              Continue
            </Button>
          )}
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

export default function ChannelTagTree({
  tagTree,
  flatUserTags,
  setFlatUserTags,
  hasChanged,
  handleSaveChanges,
  isSaving,
  goToNextStep,
  saveSuccess,
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
      goToNextStep={goToNextStep}
      saveSuccess={saveSuccess}
    />
  );
}
