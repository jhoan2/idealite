import { Skeleton } from "~/components/ui/skeleton";

export default function ChannelHeaderSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Banner skeleton */}
      <Skeleton className="h-[200px] w-full rounded-t-lg" />

      {/* Content container */}
      <div className="space-y-4 rounded-b-lg bg-background p-4">
        {/* Server name and info */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-32" /> {/* Server name */}
            <Skeleton className="h-4 w-40" /> {/* Farcaster · members text */}
          </div>
          <Skeleton className="h-9 w-16" /> {/* Post button */}
        </div>

        {/* Member avatars */}
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-8 rounded-full" />
          ))}
          <Skeleton className="ml-1 h-6 w-12 rounded-full" />{" "}
          {/* +10 indicator */}
        </div>
      </div>
    </div>
  );
}
