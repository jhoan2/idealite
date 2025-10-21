"use client";

import * as React from "react";
import {
  ColumnDef,
  SortingState,
  RowSelectionState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Trash2, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  BlogPostTableData,
  PaginatedBlogPostsResult,
} from "~/server/queries/blog";

interface DataTableProps {
  columns: ColumnDef<BlogPostTableData>[];
  data: PaginatedBlogPostsResult;
  onPageChange: (page: number) => void;
  onSortChange: (sortBy: string, sortOrder: "asc" | "desc") => void;
  onSearchChange: (search: string) => void;
  onPageSizeChange: (pageSize: number) => void;
  onPublishedFilterChange: (filter: "all" | "published" | "draft") => void;
  onBulkDelete: (postIds: number[]) => Promise<void>;
  loading?: boolean;
  bulkDeleteLoading?: boolean;
  publishedFilter: "all" | "published" | "draft";
}

export function BlogPostsDataTable({
  columns,
  data,
  onPageChange,
  onSortChange,
  onSearchChange,
  onPageSizeChange,
  onPublishedFilterChange,
  onBulkDelete,
  loading = false,
  bulkDeleteLoading = false,
  publishedFilter,
}: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [searchValue, setSearchValue] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  // Handle sorting changes
  React.useEffect(() => {
    if (sorting.length > 0) {
      const sort = sorting[0];
      if (!sort || !sort.id) return;
      onSortChange(sort.id, sort.desc ? "desc" : "asc");
    }
  }, [sorting, onSortChange]);

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, onSearchChange]);

  // Clear row selection when data changes
  React.useEffect(() => {
    setRowSelection({});
  }, [data.currentPage, data.data]);

  const table = useReactTable({
    data: data.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    pageCount: data.totalPages,
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
  });

  // Get selected post IDs
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedPostIds = selectedRows.map((row) => row.original.id);
  const hasSelectedRows = selectedPostIds.length > 0;

  const handleBulkDelete = async () => {
    if (selectedPostIds.length === 0) return;

    await onBulkDelete(selectedPostIds);
    setRowSelection({});
  };

  return (
    <div className="space-y-4">
      {/* Search Input, Filters, and Page Size Selector */}
      <div className="flex items-center justify-between space-x-2">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={publishedFilter}
            onValueChange={(value: "all" | "published" | "draft") =>
              onPublishedFilterChange(value)
            }
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Posts</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Show:</span>
          <Select
            value={data.pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">per page</span>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {hasSelectedRows && (
        <div className="flex items-center justify-between rounded-md border bg-muted/50 px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {selectedPostIds.length} post
              {selectedPostIds.length === 1 ? "" : "s"} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRowSelection({})}
              disabled={bulkDeleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkDeleteLoading}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {bulkDeleteLoading ? "Deleting..." : "Delete Selected"}
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-6 animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.data.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {searchValue
                    ? "No posts found matching your search."
                    : "No blog posts found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {(data.currentPage - 1) * data.pageSize + 1} to{" "}
          {Math.min(data.currentPage * data.pageSize, data.totalCount)} of{" "}
          {data.totalCount} posts
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(data.currentPage - 1)}
            disabled={data.currentPage <= 1 || loading}
          >
            Previous
          </Button>

          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
              let pageNumber;
              if (data.totalPages <= 5) {
                pageNumber = i + 1;
              } else if (data.currentPage <= 3) {
                pageNumber = i + 1;
              } else if (data.currentPage >= data.totalPages - 2) {
                pageNumber = data.totalPages - 4 + i;
              } else {
                pageNumber = data.currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNumber}
                  variant={
                    pageNumber === data.currentPage ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => onPageChange(pageNumber)}
                  disabled={loading}
                  className="h-8 w-8 p-0"
                >
                  {pageNumber}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(data.currentPage + 1)}
            disabled={data.currentPage >= data.totalPages || loading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
