"use client";

import * as React from "react";
import { Command } from "cmdk";
import { Search, FileText } from "lucide-react";
import { useLocalSearch } from "../_hooks/useLocalSearch";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "~/components/ui/dialog";

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [query, setQuery] = React.useState("");
  const results = useLocalSearch(query);
  const router = useRouter();

  // Close modal and navigate
  const onSelect = (id: string) => {
    onOpenChange(false);
    router.push(`/notes/${id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-lg sm:max-w-[600px]">
        <Command className="flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground">
          <div className="flex items-center border-b px-3" cmk-input-wrapper="">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Search notes by title..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
            <Command.Empty className="py-6 text-center text-sm">
              No local notes found.
            </Command.Empty>
            
            {results?.map((page) => (
              <Command.Item
                key={page.id}
                onSelect={() => onSelect(page.id)}
                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                <FileText className="mr-2 h-4 w-4" />
                <span>{page.title}</span>
              </Command.Item>
            ))}
          </Command.List>
          
          <div className="flex items-center justify-between border-t p-2 text-[10px] text-muted-foreground uppercase tracking-widest">
            <span>Local Results Only</span>
            <div className="flex gap-2">
              <kbd className="rounded bg-muted px-1">↑↓ Navigate</kbd>
              <kbd className="rounded bg-muted px-1">↵ Select</kbd>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
