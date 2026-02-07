"use client";

import { useLocalPage } from "../_hooks/useLocalPage";
import { useParams } from "next/navigation";
import { LocalEditor } from "../_components/LocalEditor";
import { BacklinksSection } from "../_components/BacklinksSection";
import { Skeleton } from "~/components/ui/skeleton";

export default function NotePage() {
  const params = useParams();
  const id = params.id as string;
  const { page, savePage, isLoading } = useLocalPage(id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Skeleton className="mb-12 h-14 w-3/4 bg-muted md:w-1/2" />
        <div className="space-y-8">
          <Skeleton className="h-24 w-full bg-muted" />
          <Skeleton className="h-20 w-11/12 bg-muted" />
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Note not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Title Section */}
      <input
        value={page.title}
        onChange={(e) => savePage({ title: e.target.value })}
        className="w-full bg-transparent text-4xl font-bold focus:outline-none"
        placeholder="Untitled"
      />
      
      {/* Local Editor Section */}
      <div className="mt-8">
        <LocalEditor 
          initialContent={page.content} 
          onUpdate={(content, plainText) => savePage({ content, plainText })}
        />
      </div>

      {/* Backlinks Section */}
      <BacklinksSection pageId={id} />
    </div>
  );
}
