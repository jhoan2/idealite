"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Trash2, Edit } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Checkbox } from "~/components/ui/checkbox";
import { formatDistanceToNow } from "date-fns";
import { BlogPostTableData } from "~/server/queries/blog";
import Link from "next/link";

interface ColumnsProps {
  onDelete: (postId: number) => Promise<void>;
  loadingStates: {
    deleting: Set<number>;
  };
}

export const createColumns = ({
  onDelete,
  loadingStates,
}: ColumnsProps): ColumnDef<BlogPostTableData>[] => [
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
      return <div className="font-medium">{title}</div>;
    },
  },
  {
    accessorKey: "slug",
    header: "Slug",
    cell: ({ row }) => {
      const slug = row.getValue("slug") as string;
      return <div className="text-sm text-muted-foreground">{slug}</div>;
    },
    enableSorting: false,
  },
  {
    accessorKey: "published",
    header: "Status",
    cell: ({ row }) => {
      const published = row.getValue("published") as boolean;
      return (
        <Badge
          variant={published ? "default" : "secondary"}
          className={
            published
              ? "bg-green-100 text-green-800 hover:bg-green-100"
              : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
          }
        >
          {published ? "Published" : "Draft"}
        </Badge>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "createdAt",
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
      const date = row.getValue("createdAt") as Date | null;
      if (!date) return <span className="text-sm text-muted-foreground">—</span>;
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
    accessorKey: "publishedAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Published
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("publishedAt") as Date | null;
      if (!date) return <span className="text-sm text-muted-foreground">—</span>;
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
      const postId = row.original.id;
      const isDeleting = loadingStates.deleting.has(postId);

      return (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-8 w-8 p-0"
          >
            <Link href={`/admin/blog/${postId}/edit`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(postId)}
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
