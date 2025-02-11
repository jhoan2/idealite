import { Skeleton } from "~/components/ui/skeleton";

const CardSkeleton = () => {
  return (
    <div>
      <div className="m-4 rounded-lg border bg-card p-4 shadow-sm">
        <div className="space-y-3">
          {/* Text content loading state with varying widths */}
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/4" />

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-3">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
        </div>
      </div>
      <div className="m-4 rounded-lg border bg-card p-4 shadow-sm">
        <div className="space-y-3">
          {/* Text content loading state with varying widths */}
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/4" />

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-3">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardSkeleton;
