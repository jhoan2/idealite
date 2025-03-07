import React from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { ChevronDown } from "lucide-react";

const TagTreeSkeleton = () => {
  return (
    <div className="w-1/2 max-w-md overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="custom-scrollbar h-screen overflow-y-auto p-4">
        <div className="flex items-center space-x-2 pb-2">
          <ChevronDown className="h-4 w-4 text-gray-400" />
          <Skeleton className="h-4 w-1/2 bg-gray-100 dark:bg-gray-600" />
        </div>
        <div className="space-y-2 pl-6">
          <div className="flex items-center space-x-2">
            <ChevronDown className="h-4 w-4 text-gray-400" />
            <Skeleton className="h-4 w-1/2 bg-gray-100 dark:bg-gray-600" />
          </div>
          <div className="flex items-center space-x-2">
            <ChevronDown className="h-4 w-4 text-gray-400" />
            <Skeleton className="h-4 w-1/2 bg-gray-100 dark:bg-gray-600" />
          </div>
          <div className="space-y-2 pl-6">
            <div className="flex items-center space-x-2">
              <ChevronDown className="h-4 w-4 text-gray-400" />
              <Skeleton className="h-4 w-1/2 bg-gray-100 dark:bg-gray-600" />
            </div>
            <div className="flex items-center space-x-2">
              <ChevronDown className="h-4 w-4 text-gray-400" />
              <Skeleton className="h-4 w-1/2 bg-gray-100 dark:bg-gray-600" />
            </div>
            <div className="flex items-center space-x-2">
              <ChevronDown className="h-4 w-4 text-gray-400" />
              <Skeleton className="h-4 w-1/2 bg-gray-100 dark:bg-gray-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagTreeSkeleton;
