"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "~/storage/db";
import Link from "next/link";
import { FileText } from "lucide-react";

interface BacklinksSectionProps {
  pageId: string;
}

export function BacklinksSection({ pageId }: BacklinksSectionProps) {
  // Query for all pages that target this pageId
  const backlinks = useLiveQuery(async () => {
    const links = await db.links.where("targetPageId").equals(pageId).toArray();
    
    // Get the actual page objects for the source pages
    const sourceIds = links.map(l => l.sourcePageId);
    return await db.pages.where("id").anyOf(sourceIds).toArray();
  }, [pageId]);

  if (!backlinks || backlinks.length === 0) return null;

  return (
    <div className="mt-16 border-t pt-8">
      <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Backlinks ({backlinks.length})
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {backlinks.map((page) => (
          <Link
            key={page.id}
            href={`/notes/${page.id}`}
            className="group flex items-start gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
          >
            <FileText className="mt-1 h-4 w-4 text-muted-foreground group-hover:text-primary" />
            <div>
              <div className="font-medium">{page.title}</div>
              <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {page.plainText || "No preview available"}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
