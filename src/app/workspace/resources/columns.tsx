// src/app/resources/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ResourceTableData } from "~/server/queries/resource";
const getTypeLabel = (type: string) => {
  switch (type) {
    case "url":
      return "URL";
    case "crossref":
      return "Science Paper";
    case "open_library":
      return "Book";
    default:
      return type;
  }
};

const getTypeBadgeVariant = (type: string) => {
  switch (type) {
    case "url":
      return "default";
    case "crossref":
      return "secondary";
    case "open_library":
      return "outline";
    default:
      return "default";
  }
};

export const columns: ColumnDef<ResourceTableData>[] = [
  {
    accessorKey: "image",
    header: "Image",
    cell: ({ row }) => {
      const image = row.getValue("image") as string | null;
      const title = row.getValue("title") as string;

      return (
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border bg-muted">
          {image ? (
            <img
              src={image}
              alt={title}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="h-full w-full" />
          )}
        </div>
      );
    },
    enableSorting: false,
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
      const url = row.original.url;

      return (
        <div className="font-medium">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-blue-600 hover:underline"
          >
            {title}
          </a>
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      const label = getTypeLabel(type);
      const variant = getTypeBadgeVariant(type);

      return (
        <Badge variant={variant as any} className="text-xs">
          {label}
        </Badge>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "author",
    header: "Author",
    cell: ({ row }) => {
      const author = row.getValue("author") as string | null;

      if (!author) {
        return <span className="text-sm text-muted-foreground">No author</span>;
      }

      return (
        <div className="max-w-[200px] truncate text-sm" title={author}>
          {author}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const description = row.getValue("description") as string | null;

      if (!description) {
        return (
          <span className="text-sm text-muted-foreground">No description</span>
        );
      }

      return (
        <div className="max-w-[300px] truncate text-sm" title={description}>
          {description}
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
          Added
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
];
