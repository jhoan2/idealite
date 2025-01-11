import React from "react";
import { Skeleton } from "~/components/ui/skeleton";

const WorkspaceSkeleton = () => {
  return (
    <div className="flex h-screen w-full">
      {/* Sidebar Skeleton */}
      <div className="w-64 border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="p-4">
          <Skeleton className="h-8 w-full bg-gray-100 dark:bg-gray-600" />
          <div className="mt-4 space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className="h-6 w-full bg-gray-100 dark:bg-gray-600"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSkeleton;
