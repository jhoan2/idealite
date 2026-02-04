
"use client";

import * as React from "react";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { Button } from "~/components/ui/button";
import { TagNode } from "./tagUtils";
import { flattenTree } from "./searchUtils";

interface TagSearchProps {
  tagTree: TagNode[];
  onSelectTag: (tagId: string) => void;
}

export function TagSearch({ tagTree, onSelectTag }: TagSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [flatTags, setFlatTags] = React.useState<TagNode[]>([]);

  // Flatten the tree for search when data changes or dialog opens
  React.useEffect(() => {
    if (tagTree) {
        setFlatTags(flattenTree(tagTree));
    }
  }, [tagTree]);

  const handleSelect = React.useCallback((id: string) => {
    onSelectTag(id);
    setOpen(false);
  }, [onSelectTag]);

  return (
    <>
      <Button
        variant="outline"
        className="fixed bottom-8 left-[75%] z-50 w-80 -translate-x-1/2 justify-start rounded-full border-slate-200 bg-white/90 px-4 py-6 text-sm text-muted-foreground shadow-2xl backdrop-blur-md hover:bg-white hover:text-foreground dark:border-slate-800 dark:bg-slate-950/90"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-3 h-5 w-5 text-slate-400" />
        <span className="flex-1 text-left">Search skills and tags...</span>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type to search..." />
        <CommandList>
          <CommandEmpty>No tags found.</CommandEmpty>
          <CommandGroup heading="Tags">
            {flatTags.map((tag) => (
              <CommandItem
                key={tag.id}
                value={tag.name} // Search by name
                onSelect={() => handleSelect(tag.id)}
              >
                <div className="flex items-center gap-2">
                    <div 
                        className="h-2 w-2 rounded-full" 
                        style={{ backgroundColor: tag.color || '#94a3b8' }} 
                    />
                    <span>{tag.name}</span>
                    {tag.isInBoth && (
                        <span className="ml-2 text-[10px] text-muted-foreground uppercase bg-secondary px-1 rounded">
                            Owned
                        </span>
                    )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
