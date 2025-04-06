export default function LeaderboardLoading() {
  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <div className="mb-2 h-8 w-40 animate-pulse rounded bg-muted/50"></div>
        <div className="h-4 w-64 animate-pulse rounded bg-muted/30"></div>
      </div>

      <div className="mb-4">
        <div className="h-10 w-48 animate-pulse rounded bg-muted/50"></div>
      </div>

      <div className="space-y-4">
        {Array.from({ length: 10 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center justify-between rounded-lg bg-card/80 p-3 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted/50"></div>
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted/50"></div>
              <div className="h-5 w-32 animate-pulse rounded bg-muted/50"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 animate-pulse rounded bg-muted/50"></div>
              <div className="h-5 w-16 animate-pulse rounded bg-muted/50"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
