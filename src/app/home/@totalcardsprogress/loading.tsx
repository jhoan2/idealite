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
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-48 bg-muted" />
          </div>
          <Skeleton className="mt-2 h-4 w-64 bg-muted/80" />
          <Skeleton className="mt-1 h-3 w-20 bg-muted/60" />
        </div>

        {/* Progress ring skeleton and arrow */}
        <div className="ml-4 flex items-center space-x-3">
          <div className="relative" style={{ width: 40, height: 40 }}>
            <Skeleton className="h-10 w-10 rounded-full bg-muted/70" />
          </div>
          <ChevronLeft className="h-5 w-5 rotate-180 text-muted-foreground" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-h-[500px] bg-background p-4">
      <div className="mx-auto max-w-2xl">
        {/* Main Content */}
        <div className="mb-8">
          {/* Section Header */}
          <div className="mb-4">
            <Skeleton className="h-6 w-24 bg-muted" />
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
