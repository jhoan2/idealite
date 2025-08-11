// src/app/pages/page.tsx
"use client";

import * as React from "react";
import { PagesDataTable } from "./data-table";
import { columns } from "./columns";
import { getPagesForUser, PaginatedPagesResult } from "~/server/queries/page";

export default function PagesTablePage() {
  const [data, setData] = React.useState<PaginatedPagesResult>({
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
  const [sortBy, setSortBy] = React.useState<
    "title" | "created_at" | "updated_at"
  >("updated_at");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [search, setSearch] = React.useState("");

  // Fetch data function
  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getPagesForUser({
        page: currentPage,
        pageSize: 10,
        sortBy,
        sortOrder,
        search: search.trim(),
      });

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching pages:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortBy, sortOrder, search]);

  // Fetch data on mount and when dependencies change
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset to page 1 when search or sort changes
  React.useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchData();
    }
  }, [sortBy, sortOrder, search]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSortChange = (
    newSortBy: string,
    newSortOrder: "asc" | "desc",
  ) => {
    setSortBy(newSortBy as "title" | "created_at" | "updated_at");
    setSortOrder(newSortOrder);
  };

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
  };

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading pages
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
        <h1 className="text-3xl font-bold tracking-tight">Pages</h1>
        <p className="text-muted-foreground">Manage and browse your pages</p>
      </div>

      <PagesDataTable
        columns={columns}
        data={data}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
        onSearchChange={handleSearchChange}
        loading={loading}
      />
    </div>
  );
}
