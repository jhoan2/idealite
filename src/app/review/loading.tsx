"use client";

import { Skeleton } from "~/components/ui/skeleton";
import { Button } from "~/components/ui/button";
import { ChevronsUpDown, ChevronDown } from "lucide-react";

export default function CardsLoading() {
  return (
    <div className="flex min-h-[calc(100vh-100px)] flex-col">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Review Cards</h1>
      <div className="flex justify-between">
        <div className="mb-2 hidden space-x-2 md:flex">
          <Button
            variant="outline"
            className="mb-2 flex justify-between"
            disabled
          >
            Filter by Tags
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>

          <Button
            variant="outline"
            className="mb-2 flex justify-between"
            disabled
          >
            How many?
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </div>
        <div>
          <Button disabled>Review</Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-20 rounded-full" />
        ))}
      </div>

      <div className="mb-6 rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-2 text-xl font-semibold text-card-foreground">
          Cards Due
        </h2>
        <Skeleton className="h-9 w-16" />
      </div>

      <div className="w-full pb-6 md:hidden">
        <Button className="w-full" disabled>
          Review
        </Button>
      </div>
    </div>
  );
}
