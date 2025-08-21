// src/app/workspace/pages/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Pin, PinOff, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Checkbox } from "~/components/ui/checkbox";
import { formatDistanceToNow } from "date-fns";
import { PageTableData } from "~/server/queries/page";

interface ColumnsProps {
  onPin: (pageId: string) => Promise<void>;
  onUnpin: (pageId: string) => Promise<void>;
  onDelete: (pageId: string) => Promise<void>;
  pinnedPageIds: Set<string>;
  loadingStates: {
    pinning: Set<string>;
    unpinning: Set<string>;
    deleting: Set<string>;
  };
}

export const createColumns = ({
  onPin,
  onUnpin,
  onDelete,
  pinnedPageIds,
  loadingStates,
}: ColumnsProps): ColumnDef<PageTableData>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const title = row.getValue("title") as string;
      const pageId = row.original.id;
      const workspaceUrl = `/workspace?pageId=${pageId}`;

      return (
        <div className="w-32 min-w-[8rem] max-w-[12rem] font-medium">
          <a
            href={workspaceUrl}
            className="transition-colors hover:text-blue-600 hover:underline"
          >
            {title}
          </a>
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const description = row.getValue("description") as string | null;

      if (!description) {
        return (
          <span className="text-sm italic text-muted-foreground">
            No description
          </span>
        );
      }

      const maxLength = 100;
      const truncatedDescription =
        description.length > maxLength
          ? description.slice(0, maxLength) + "..."
          : description;

      return (
        <div className="max-w-[300px]">
          <p
            className="line-clamp-2 text-sm text-muted-foreground"
            title={description}
          >
            {truncatedDescription}
          </p>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => {
      const tags = row.getValue("tags") as Array<{ id: string; name: string }>;

      if (!tags || tags.length === 0) {
        return <span className="text-sm text-muted-foreground">No tags</span>;
      }

      const visibleTags = tags.slice(0, 3);
      const remainingCount = tags.length - 3;

      return (
        <div className="flex w-28 min-w-[7rem] max-w-[8rem] flex-wrap gap-1">
          {visibleTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="max-w-full truncate px-1 py-0 text-xs"
            >
              {tag.name}
            </Badge>
          ))}
          {remainingCount > 0 && (
            <Badge
              variant="outline"
              className="px-1 py-0 text-xs text-muted-foreground"
            >
              +{remainingCount}
            </Badge>
          )}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("created_at") as Date;
      return (
        <div className="text-sm">
          <div className="font-medium">
            {formatDistanceToNow(date, { addSuffix: true })}
          </div>
          <div className="text-xs text-muted-foreground">
            {date.toLocaleDateString()}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "updated_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Updated
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("updated_at") as Date | null;

      if (!date) {
        return <span className="text-sm text-muted-foreground">Never</span>;
      }

      return (
        <div className="text-sm">
          <div className="font-medium">
            {formatDistanceToNow(date, { addSuffix: true })}
          </div>
          <div className="text-xs text-muted-foreground">
            {date.toLocaleDateString()}
          </div>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const pageId = row.original.id;
      const isPinned = pinnedPageIds.has(pageId);
      const isPinning = loadingStates.pinning.has(pageId);
      const isUnpinning = loadingStates.unpinning.has(pageId);
      const isDeleting = loadingStates.deleting.has(pageId);

      return (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (isPinned ? onUnpin(pageId) : onPin(pageId))}
            disabled={isPinning || isUnpinning}
            className="h-8 w-8 p-0"
          >
            {isPinned ? (
              <PinOff className="h-4 w-4" />
            ) : (
              <Pin className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(pageId)}
            disabled={isDeleting}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];
