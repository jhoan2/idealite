import { Skeleton } from "~/components/ui/skeleton";

export default function LoadingFeed() {
  return (
    <div className="mx-auto w-full max-w-xl space-y-4 bg-background p-4">
      {/* Repeat skeleton tweets 3 times */}
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="w-full space-y-4 rounded-xl border border-border/10 p-4"
        >
          <div className="flex gap-3">
            {/* Avatar skeleton */}
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                {/* Name skeleton */}
                <Skeleton className="h-5 w-32" />
                {/* Handle skeleton */}
                <Skeleton className="h-4 w-24" />
                {/* Time skeleton */}
                <Skeleton className="ml-auto h-4 w-16" />
              </div>
              {/* Content skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-[90%]" />
                <Skeleton className="h-4 w-[80%]" />
              </div>
              {/* Engagement metrics skeleton */}
              <div className="flex gap-6 pt-4">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="ml-auto h-4 w-8" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
