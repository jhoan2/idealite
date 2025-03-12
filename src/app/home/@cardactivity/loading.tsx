import { Skeleton } from "~/components/ui/skeleton";

export default function CardActivityLoading() {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="relative overflow-hidden">
          <Skeleton className="h-[160px] w-full rounded-lg bg-gray-700/40" />
          <div className="absolute left-6 right-6 top-6">
            <Skeleton className="mb-2 h-4 w-24 bg-gray-700/70" />
            <div className="mt-1 flex items-baseline">
              <Skeleton className="h-8 w-16 bg-gray-700" />
              <Skeleton className="ml-2 h-4 w-12 bg-gray-700/60" />
            </div>
            <Skeleton className="mt-1 h-3 w-32 bg-gray-700/50" />
          </div>
          <div className="absolute right-6 top-6">
            <Skeleton className="h-10 w-10 rounded-full bg-gray-700/80" />
          </div>
        </div>
      ))}
    </div>
  );
}
