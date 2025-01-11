import React from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { ChevronDown } from "lucide-react";

const TagTreeSkeleton = () => {
  return (
    <div className="space-y-2 pl-1">
      <div className="flex items-center space-x-2">
        <ChevronDown className="h-4 w-4 text-gray-400" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="space-y-2 pl-6">
        <div className="flex items-center space-x-2">
          <ChevronDown className="h-4 w-4 text-gray-400" />
          <Skeleton className="h-4 w-14" />
        </div>
        <div className="flex items-center space-x-2">
          <ChevronDown className="h-4 w-4 text-gray-400" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="space-y-2 pl-6">
          <div className="flex items-center space-x-2">
            <ChevronDown className="h-4 w-4 text-gray-400" />
            <Skeleton className="h-4 w-14" />
          </div>
          <div className="flex items-center space-x-2">
            <ChevronDown className="h-4 w-4 text-gray-400" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex items-center space-x-2">
            <ChevronDown className="h-4 w-4 text-gray-400" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagTreeSkeleton;
