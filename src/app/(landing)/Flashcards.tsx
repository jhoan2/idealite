import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { X, Check, SkipForward } from "lucide-react";
export default function CardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>

      <div className="mb-8 space-y-2 text-center">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mx-auto h-4 w-5/6" />
        <Skeleton className="mx-auto h-4 w-4/6" />
      </div>

      <div className="mt-4 flex justify-between gap-2">
        <Button
          variant="outline"
          className="flex-1 gap-2 border-red-500 text-red-500 hover:bg-red-500/20 hover:text-red-400"
        >
          <X className="h-5 w-5" />
          Wrong
        </Button>
        <Button
          variant="outline"
          className="flex-1 gap-2 border-border text-foreground hover:bg-foreground/10"
        >
          <SkipForward className="h-5 w-5" />
          Skip
        </Button>
        <Button
          variant="outline"
          className="flex-1 gap-2 border-green-500 text-green-500 hover:bg-green-500/20 hover:text-green-400"
        >
          <Check className="h-5 w-5" />
          Correct
        </Button>
      </div>
    </div>
  );
}
