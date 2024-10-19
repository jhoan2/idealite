"use client";

import React, { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Copy,
  Trash,
  Pencil,
  Plus,
  Filter,
  Search,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { Button } from "~/components/ui/button";

interface TreeNodeData {
  name: string;
  children?: TreeNodeData[];
}

interface TreeProps {
  data: TreeNodeData;
}

const TreeNode: React.FC<{ node: TreeNodeData; level: number }> = ({
  node,
  level,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(node.name);
  };

  const handleDelete = () => {
    console.log(`Delete ${node.name}`);
    // Implement delete functionality here
  };

  const handleRename = () => {
    console.log(`Rename ${node.name}`);
    // Implement rename functionality here
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
                <TreeNode key={index} node={child} level={level + 1} />
              ))}
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem onSelect={handleCopy}>
          <Copy className="mr-2 h-4 w-4" />
          <span>Copy</span>
        </ContextMenuItem>
        <ContextMenuItem onSelect={handleRename}>
          <Pencil className="mr-2 h-4 w-4" />
          <span>Rename</span>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={handleDelete} className="text-red-600">
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
      <div className="mt-4 flex justify-center space-x-2">
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add
        </Button>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
        <Button variant="outline" size="sm">
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
      </div>
      <div className="custom-scrollbar h-screen overflow-y-auto p-4">
        <TreeNode node={data} level={0} />
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

export default function Component() {
  const treeData: TreeNodeData = {
    name: "Project Root",
    children: [
      {
        name: "src",
        children: [
          {
            name: "components",
            children: [
              {
                name: "Header",
                children: [
                  {
                    name: "NavBar.tsx",
                    children: [
                      {
                        name: "NavItem.tsx",
                        children: [
                          { name: "NavLink.tsx" },
                          { name: "NavIcon.tsx" },
                        ],
                      },
                      {
                        name: "DropdownMenu.tsx",
                        children: [
                          { name: "DropdownItem.tsx" },
                          { name: "DropdownTrigger.tsx" },
                        ],
                      },
                    ],
                  },
                  {
                    name: "Logo.tsx",
                    children: [
                      {
                        name: "SVGIcon.tsx",
                        children: [
                          { name: "SVGPath.tsx" },
                          { name: "SVGGroup.tsx" },
                        ],
                      },
                      {
                        name: "TextLogo.tsx",
                        children: [
                          { name: "FontLoader.tsx" },
                          { name: "TextStyling.tsx" },
                        ],
                      },
                    ],
                  },
                  {
                    name: "SearchBar.tsx",
                    children: [
                      {
                        name: "SearchInput.tsx",
                        children: [
                          { name: "InputField.tsx" },
                          { name: "SearchIcon.tsx" },
                        ],
                      },
                      {
                        name: "SearchResults.tsx",
                        children: [
                          { name: "ResultItem.tsx" },
                          { name: "ResultList.tsx" },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                name: "Footer",
                children: [
                  {
                    name: "SocialLinks.tsx",
                    children: [
                      {
                        name: "IconButton.tsx",
                        children: [
                          { name: "ButtonBase.tsx" },
                          { name: "IconWrapper.tsx" },
                        ],
                      },
                      {
                        name: "SocialIcon.tsx",
                        children: [
                          { name: "IconLibrary.tsx" },
                          { name: "IconRenderer.tsx" },
                        ],
                      },
                    ],
                  },
                  {
                    name: "Copyright.tsx",
                    children: [
                      {
                        name: "CurrentYear.tsx",
                        children: [
                          { name: "DateFormatter.tsx" },
                          { name: "YearDisplay.tsx" },
                        ],
                      },
                      {
                        name: "LegalLinks.tsx",
                        children: [
                          { name: "PrivacyPolicy.tsx" },
                          { name: "TermsOfService.tsx" },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            name: "utils",
            children: [
              {
                name: "api.ts",
                children: [
                  {
                    name: "endpoints.ts",
                    children: [
                      { name: "userEndpoints.ts" },
                      { name: "dataEndpoints.ts" },
                    ],
                  },
                  {
                    name: "fetchWrapper.ts",
                    children: [
                      { name: "requestInterceptor.ts" },
                      { name: "responseHandler.ts" },
                    ],
                  },
                ],
              },
              {
                name: "helpers.ts",
                children: [
                  {
                    name: "formatters.ts",
                    children: [
                      { name: "dateFormatter.ts" },
                      { name: "currencyFormatter.ts" },
                    ],
                  },
                  {
                    name: "validators.ts",
                    children: [
                      { name: "inputValidators.ts" },
                      { name: "dataValidators.ts" },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        name: "public",
        children: [
          {
            name: "images",
            children: [
              {
                name: "logos",
                children: [
                  {
                    name: "vector",
                    children: [
                      {
                        name: "logo-light.svg",
                        children: [
                          { name: "logo-light-main.svg" },
                          { name: "logo-light-alt.svg" },
                        ],
                      },
                      {
                        name: "logo-dark.svg",
                        children: [
                          { name: "logo-dark-main.svg" },
                          { name: "logo-dark-alt.svg" },
                        ],
                      },
                    ],
                  },
                  {
                    name: "raster",
                    children: [
                      {
                        name: "logo-light.png",
                        children: [
                          { name: "logo-light-1x.png" },
                          { name: "logo-light-2x.png" },
                        ],
                      },
                      {
                        name: "logo-dark.png",
                        children: [
                          { name: "logo-dark-1x.png" },
                          { name: "logo-dark-2x.png" },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        name: "package.json",
        children: [{ name: "dependencies" }, { name: "devDependencies" }],
      },
      {
        name: "tsconfig.json",
        children: [{ name: "compilerOptions" }, { name: "include" }],
      },
      { name: "README.md" },
      { name: ".gitignore" },
      { name: ".env.local" },
      { name: "next.config.js" },
      { name: "postcss.config.js" },
      { name: "tailwind.config.js" },
    ],
  };

  return <MinimalistTree data={treeData} />;
}
