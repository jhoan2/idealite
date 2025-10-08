// src/app/resources/page.tsx
"use client";

import * as React from "react";
import { ResourcesDataTable } from "./data-table";
import { columns } from "./columns";
import {
  getResourcesForUser,
  PaginatedResourcesResult,
} from "~/server/queries/resource";

export default function ResourcesTablePage() {
  const [data, setData] = React.useState<PaginatedResourcesResult>({
    data: [],
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    pageSize: 10,
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // State for table controls
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [sortBy, setSortBy] = React.useState<"title" | "created_at" | "author">(
    "created_at",
  );
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [search, setSearch] = React.useState("");

  // Fetch data function
  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getResourcesForUser({
        page: currentPage,
        pageSize,
        sortBy,
        sortOrder,
        search: search.trim(),
      });

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching resources:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, sortBy, sortOrder, search]);

  // Fetch data on mount and when dependencies change
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset to page 1 when search, sort, or page size changes
  React.useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchData();
    }
  }, [sortBy, sortOrder, search, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSortChange = (
    newSortBy: string,
    newSortOrder: "asc" | "desc",
  ) => {
    setSortBy(newSortBy as "title" | "created_at" | "author");
    setSortOrder(newSortOrder);
  };

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
  };

  // Add page size change handler
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
  };

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading resources
              </h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
        <p className="text-muted-foreground">
          Manage and browse your resources
        </p>
      </div>

      <ResourcesDataTable
        columns={columns}
        data={data}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
        onSearchChange={handleSearchChange}
        onPageSizeChange={handlePageSizeChange}
        loading={loading}
      />
    </div>
  );
}
