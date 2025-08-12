// src/app/resources/data-table.tsx
"use client";

import * as React from "react";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
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
  ResourceTableData,
  PaginatedResourcesResult,
} from "~/server/queries/resource";
import { Search } from "lucide-react";

interface DataTableProps {
  columns: ColumnDef<ResourceTableData>[];
  data: PaginatedResourcesResult;
  onPageChange: (page: number) => void;
  onSortChange: (sortBy: string, sortOrder: "asc" | "desc") => void;
  onSearchChange: (search: string) => void;
  onPageSizeChange: (pageSize: number) => void;
  loading?: boolean;
}

export function ResourcesDataTable({
  columns,
  data,
  onPageChange,
  onSortChange,
  onSearchChange,
  onPageSizeChange,
  loading = false,
}: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [searchValue, setSearchValue] = React.useState("");

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

  const table = useReactTable({
    data: data.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    pageCount: data.totalPages,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  });

  return (
    <div className="space-y-4">
      {/* Search Input and Page Size Selector */}
      <div className="flex items-center justify-between space-x-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Page Size Selector */}
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
                <TableRow key={row.id}>
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
                    ? "No resources found matching your search."
                    : "No resources found."}
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
          {data.totalCount} resources
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
            {/* Show page numbers */}
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
