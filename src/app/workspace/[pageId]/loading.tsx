import { Skeleton } from "~/components/ui/skeleton";

export default function PageLoading() {
  return (
    <div className="min-h-screen bg-[#0a0c14] p-6 text-white">
      {/* Title */}
      <Skeleton className="mb-12 h-14 w-3/4 bg-gray-800 md:w-1/2" />

      {/* Content paragraphs */}
      <div className="space-y-8">
        <Skeleton className="h-24 w-full bg-gray-800" />
        <Skeleton className="h-20 w-11/12 bg-gray-800" />
        <Skeleton className="h-16 w-10/12 bg-gray-800" />
        <Skeleton className="h-16 w-11/12 bg-gray-800" />
      </div>
    </div>
  );
}
