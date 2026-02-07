"use client";

import { useEffect } from "react";
import { useDailyNote } from "./_hooks/useDailyNote";
import { Loader2 } from "lucide-react";

/**
 * Landing page for /notes.
 * Automatically redirects to today's Daily Note.
 */
export default function NotesPage() {
  const { openDailyNote } = useDailyNote();

  useEffect(() => {
    openDailyNote();
  }, []);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Opening today's note...</p>
      </div>
    </div>
  );
}
