import { Skeleton } from "~/components/ui/skeleton";

export default function EditorSkeleton() {
  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      {/* Title */}
      <Skeleton className="mb-12 h-14 w-3/4 bg-muted md:w-1/2" />

      {/* Content paragraphs */}
      <div className="space-y-8">
        <Skeleton className="h-24 w-full bg-muted" />
        <Skeleton className="h-20 w-11/12 bg-muted" />
        <Skeleton className="h-16 w-10/12 bg-muted" />
        <Skeleton className="h-16 w-11/12 bg-muted" />
      </div>
    </div>
  );
}
