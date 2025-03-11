import React from "react";
import { Skeleton } from "~/components/ui/skeleton";

const PlaySkeleton = () => {
  return (
    <div className="p-6">
      {/* Grid of skeleton items */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {/* Generate 12 skeleton items */}
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="flex flex-col items-center">
            {/* Icon area skeleton */}
            <Skeleton className="mb-3 h-16 w-16 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlaySkeleton;
