import { Skeleton } from "~/components/ui/skeleton";

interface PageCardSkeletonProps {
  count?: number;
}

export default function PageCardSkeleton({ count = 5 }: PageCardSkeletonProps) {
  return (
    <div className="space-y-2">
      {[...Array(count)].map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-md border border-border bg-background p-4"
        >
          <Skeleton className="h-5 w-5 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
