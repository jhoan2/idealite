import { Skeleton } from "~/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">Account Settings</h1>
      <div className="space-y-6">
        {/* Profile Tab */}
        <Skeleton className="h-9 w-24 rounded-md bg-gray-800/50" />

        {/* Profile Section */}
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <Skeleton className="h-16 w-16 rounded-full" />

          <div className="space-y-2">
            {/* Name */}
            <Skeleton className="h-6 w-32" />

            {/* Username */}
            <Skeleton className="h-4 w-24" />

            {/* Bio - Multiple lines */}
            <div className="space-y-1">
              <Skeleton className="h-4 w-[600px]" />
              <Skeleton className="h-4 w-[500px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
