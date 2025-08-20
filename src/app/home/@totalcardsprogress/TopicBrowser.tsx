"use client";
import React, { useState } from "react";
import { ChevronLeft, Book, Star } from "lucide-react";

// Types for the component props
export type TagHierarchyNode = {
  id: string;
  name: string;
  parent?: string;
  children: string[];
  progress: number;
  description?: string;
  isPinned: boolean;
  cardCount: number;
};

export type TagHierarchyData = {
  [key: string]: TagHierarchyNode;
};

// Add breadcrumb type
type Breadcrumb = {
  id: string;
  name: string;
};

interface HierarchicalTopicBrowserProps {
  tagTree: TagHierarchyData;
}

// Progress ring component
interface ProgressRingProps {
  progress: number;
  size?: number;
}

const ProgressRing: React.FC<ProgressRingProps> = ({ progress, size = 40 }) => {
  const radius = (size - 4) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="-rotate-90 transform" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="2"
          fill="transparent"
          className="text-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="2"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="text-primary transition-all duration-300"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-medium text-foreground">{progress}%</span>
      </div>
    </div>
  );
};

const HierarchicalTopicBrowser: React.FC<HierarchicalTopicBrowserProps> = ({
  tagTree,
}) => {
  const [currentTagId, setCurrentTagId] = useState("root");
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);

  const currentTag = tagTree[currentTagId];
  // Fix: Explicitly filter out undefined values and type the result
  const children: TagHierarchyNode[] =
    currentTag?.children
      ?.map((childId) => tagTree[childId])
      .filter((child): child is TagHierarchyNode => child !== undefined) || [];

  // Determine which sections to show
  const showPinnedFirst = currentTagId === "root";
  const availableSections = showPinnedFirst
    ? ["pinned", "root"]
    : [currentTagId];

  // Get siblings for header tabs - fix type safety
  const siblings: TagHierarchyNode[] = (() => {
    if (currentTag?.parent) {
      const parentChildren = tagTree[currentTag.parent]?.children || [];
      return parentChildren
        .map((siblingId) => tagTree[siblingId])
        .filter(
          (sibling): sibling is TagHierarchyNode => sibling !== undefined,
        );
    } else {
      return availableSections
        .map((sectionId) => tagTree[sectionId])
        .filter(
          (section): section is TagHierarchyNode => section !== undefined,
        );
    }
  })();

  const handleItemClick = (tagId: string) => {
    const targetTag = tagTree[tagId];
    if (targetTag && targetTag.children && targetTag.children.length > 0) {
      if (currentTag) {
        setBreadcrumbs((prev) => [
          ...prev,
          { id: currentTagId, name: currentTag.name },
        ]);
        setCurrentTagId(tagId);
      }
    } else {
      // If it's a leaf node, you can add any logic here for what should happen
      // For example, you could navigate to a study page, show cards, etc.
      console.log("Selected leaf tag:", tagId);
    }
  };

  const handleBackClick = () => {
    if (breadcrumbs.length > 0) {
      const lastBreadcrumb = breadcrumbs[breadcrumbs.length - 1]!;
      setBreadcrumbs((prev) => prev.slice(0, -1));
      setCurrentTagId(lastBreadcrumb.id);
    }
  };

  const handleTabClick = (tagId: string) => {
    setCurrentTagId(tagId);
  };

  const renderSection = (
    sectionTag: TagHierarchyNode,
    sectionChildren: TagHierarchyNode[],
    isPinned = false,
  ) => (
    <div key={sectionTag.id} className="mb-8">
      {/* Section Header */}
      <div className="mb-4 flex items-center gap-2">
        {isPinned && <Star className="h-5 w-5 fill-current text-yellow-500" />}
        <h2 className="text-xl font-bold text-foreground">{sectionTag.name}</h2>
        {isPinned && (
          <span className="rounded-full bg-accent px-2 py-1 text-sm text-muted-foreground">
            Quick Access
          </span>
        )}
      </div>

      {/* Section Content */}
      <div className="space-y-3">
        {sectionChildren.length > 0 ? (
          sectionChildren.map((child) => (
            <div
              key={child.id}
              onClick={() => handleItemClick(child.id)}
              className={`rounded-xl bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md ${
                child.children && child.children.length > 0
                  ? "cursor-pointer hover:scale-[1.02]"
                  : "cursor-pointer hover:scale-[1.02]"
              } ${isPinned ? "border-l-4 border-yellow-400" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-card-foreground">
                      {child.name}
                    </h3>
                    {child.isPinned && currentTagId !== "pinned" && (
                      <Star className="h-4 w-4 fill-current text-yellow-500" />
                    )}
                  </div>
                  {child.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {child.description}
                    </p>
                  )}
                  {child.children && child.children.length > 0 ? (
                    <p className="mt-1 text-xs text-secondary-foreground">
                      {child.children.length} subtopics
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-primary">
                      {child.cardCount} cards
                    </p>
                  )}
                </div>

                {/* Progress */}
                <div className="ml-4 flex items-center space-x-3">
                  <ProgressRing progress={child.progress} />
                  <ChevronLeft className="h-5 w-5 rotate-180 text-muted-foreground" />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl bg-card p-8 text-center shadow-sm">
            <Book className="mx-auto mb-4 h-12 w-12 text-muted" />
            <h3 className="mb-2 text-lg font-medium text-muted-foreground">
              No subtopics
            </h3>
            <p className="text-sm text-muted-foreground">
              This topic contains study materials and flashcards.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-h-[500px] overflow-y-auto bg-background p-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 rounded-xl bg-card shadow-sm">
          {/* Back navigation */}
          {breadcrumbs.length > 0 && (
            <div className="border-b border-border p-4">
              <button
                onClick={handleBackClick}
                className="flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back to {breadcrumbs[breadcrumbs.length - 1]?.name}
              </button>
            </div>
          )}

          {/* Section tabs */}
          {!showPinnedFirst && (
            <div className="flex overflow-x-auto">
              {siblings.map((sibling) => (
                <button
                  key={sibling.id}
                  onClick={() => handleTabClick(sibling.id)}
                  className={`whitespace-nowrap border-b-2 px-6 py-4 text-sm font-medium transition-colors ${
                    sibling.id === currentTagId
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-transparent text-muted-foreground hover:border-primary/50 hover:text-primary"
                  }`}
                >
                  {sibling.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main Content */}
        {showPinnedFirst ? (
          // Show both pinned and subjects sections
          <div>
            {tagTree["pinned"] &&
              renderSection(
                tagTree["pinned"],
                tagTree["pinned"].children
                  ?.map((childId) => tagTree[childId])
                  .filter(
                    (child): child is TagHierarchyNode => child !== undefined,
                  ) || [],
                true,
              )}
            {tagTree["root"] &&
              renderSection(
                tagTree["root"],
                tagTree["root"].children
                  ?.map((childId) => tagTree[childId])
                  .filter(
                    (child): child is TagHierarchyNode => child !== undefined,
                  ) || [],
              )}
          </div>
        ) : (
          // Show single section with breadcrumb
          <div>
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-foreground">
                {currentTag?.name}
              </h1>
              {breadcrumbs.length > 0 && (
                <div className="mt-1 text-sm text-muted-foreground">
                  {breadcrumbs.map((crumb) => crumb.name).join(" > ")} &gt;{" "}
                  {currentTag?.name}
                </div>
              )}
            </div>
            {currentTag && renderSection(currentTag, children)}
          </div>
        )}

        {/* Footer info */}
        {children.length > 0 && !showPinnedFirst && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center rounded-full bg-card px-4 py-2 shadow-sm">
              <span className="text-sm text-muted-foreground">
                <span className="font-medium text-primary">
                  {children.filter((child) => child.progress >= 80).length}
                </span>{" "}
                of {children.length} topics mastered •{" "}
                <span className="font-medium text-secondary-foreground">
                  {children.reduce((sum, child) => sum + child.cardCount, 0)}
                </span>{" "}
                total cards
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HierarchicalTopicBrowser;
