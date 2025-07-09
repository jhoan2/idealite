// src/app/notifications/loading.tsx
import { Skeleton } from "~/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 border-b bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-border">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-4 w-48" />
                <div className="flex flex-shrink-0 items-center gap-2">
                  <Skeleton className="h-3 w-8" />
                  <Skeleton className="h-6 w-6 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-6">
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    </div>
  );
}
