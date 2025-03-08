import { Skeleton } from "~/components/ui/skeleton";

export default function HeaderSkeleton() {
  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      {/* Title */}
      <Skeleton className="mb-12 h-14 w-3/4 bg-muted md:w-1/2" />
    </div>
  );
}
