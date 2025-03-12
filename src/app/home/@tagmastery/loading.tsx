import { Skeleton } from "~/components/ui/skeleton";

export default function TagMasteryLoading() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="mb-1">
        <Skeleton className="mb-1 h-7 w-48 bg-gray-700" />
        <Skeleton className="h-5 w-64 bg-gray-700/50" />
      </div>

      <div className="space-y-8">
        {/* Subject bars */}
        {["Algebra", "Mathematics", "Physics", "Biology"].map(
          (subject, index) => (
            <div key={index} className="flex items-center space-x-4">
              <Skeleton className="h-5 w-24 bg-gray-700/70" />
              <Skeleton className="h-8 flex-1 bg-gray-700/40" />
            </div>
          ),
        )}

        {/* X-axis labels */}
        <div className="flex justify-between border-t border-gray-700/30">
          <Skeleton className="h-4 w-6 bg-gray-700/50" />
          <Skeleton className="h-4 w-8 bg-gray-700/50" />
          <Skeleton className="h-4 w-8 bg-gray-700/50" />
          <Skeleton className="h-4 w-8 bg-gray-700/50" />
          <Skeleton className="h-4 w-10 bg-gray-700/50" />
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center space-x-6">
          {["Mastered", "Learning", "Paused"].map((label, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Skeleton className="h-3 w-3 rounded-full bg-gray-700/70" />
              <Skeleton className="h-4 w-16 bg-gray-700/50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
