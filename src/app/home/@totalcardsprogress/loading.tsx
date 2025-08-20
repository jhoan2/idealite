import React from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";

interface MinimalTopicBrowserSkeletonProps {
  itemCount?: number;
}

const MinimalTopicBrowserSkeleton: React.FC<
  MinimalTopicBrowserSkeletonProps
> = ({ itemCount = 4 }) => {
  const renderSkeletonCard = () => (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="mt-2 h-4 w-64" />
          <Skeleton className="mt-1 h-3 w-20" />
        </div>

        {/* Progress ring skeleton and arrow */}
        <div className="ml-4 flex items-center space-x-3">
          <div className="relative" style={{ width: 40, height: 40 }}>
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          <ChevronLeft className="h-5 w-5 rotate-180 text-gray-300" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-h-[500px] bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="mx-auto max-w-2xl">
        {/* Main Content */}
        <div className="mb-8">
          {/* Section Header */}
          <div className="mb-4">
            <Skeleton className="h-6 w-24" />
          </div>

          {/* Topic Cards */}
          <div className="space-y-3">
            {Array.from({ length: itemCount }, (_, index) => (
              <div key={index}>{renderSkeletonCard()}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinimalTopicBrowserSkeleton;
