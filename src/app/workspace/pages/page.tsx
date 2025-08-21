// src/app/workspace/pages/page.tsx
"use client";

import * as React from "react";
import { PagesDataTable } from "./data-table";
import { createColumns } from "./columns";
import { getPagesForUser, PaginatedPagesResult } from "~/server/queries/page";
import { getUserPinnedPages } from "~/server/queries/pinnedPages";
import { pinPage, unpinPage } from "~/server/actions/pinnedPages";
import { deletePage, deleteMultiplePages } from "~/server/actions/page";

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
  const [pinnedPageIds, setPinnedPageIds] = React.useState<Set<string>>(
    new Set(),
  );

  // Loading states for individual actions
  const [loadingStates, setLoadingStates] = React.useState({
    pinning: new Set<string>(),
    unpinning: new Set<string>(),
    deleting: new Set<string>(),
  });
  const [bulkDeleteLoading, setBulkDeleteLoading] = React.useState(false);

  // Table control state
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [sortBy, setSortBy] = React.useState<
    "title" | "created_at" | "updated_at"
  >("updated_at");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [search, setSearch] = React.useState("");

  // Fetch pinned pages
  const fetchPinnedPages = React.useCallback(async () => {
    try {
      const pinnedPages = await getUserPinnedPages();
      setPinnedPageIds(new Set(pinnedPages.map((p) => p.id)));
    } catch (err) {
      console.error("Error fetching pinned pages:", err);
    }
  }, []);

  // Fetch data function
  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getPagesForUser({
        page: currentPage,
        pageSize,
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
  }, [currentPage, pageSize, sortBy, sortOrder, search]);

  // Helper function to update loading states
  const updateLoadingState = (
    type: keyof typeof loadingStates,
    pageId: string,
    isLoading: boolean,
  ) => {
    setLoadingStates((prev) => {
      const newSet = new Set(prev[type]);
      if (isLoading) {
        newSet.add(pageId);
      } else {
        newSet.delete(pageId);
      }
      return { ...prev, [type]: newSet };
    });
  };

  // Action handlers
  const handlePin = async (pageId: string) => {
    updateLoadingState("pinning", pageId, true);
    try {
      const result = await pinPage({ pageId });
      if (result.success) {
        setPinnedPageIds((prev) => new Set([...prev, pageId]));
      } else {
        console.error("Failed to pin page:", result.error);
      }
    } catch (error) {
      console.error("Error pinning page:", error);
    } finally {
      updateLoadingState("pinning", pageId, false);
    }
  };

  const handleUnpin = async (pageId: string) => {
    updateLoadingState("unpinning", pageId, true);
    try {
      const result = await unpinPage({ pageId });
      if (result.success) {
        setPinnedPageIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(pageId);
          return newSet;
        });
      } else {
        console.error("Failed to unpin page:", result.error);
      }
    } catch (error) {
      console.error("Error unpinning page:", error);
    } finally {
      updateLoadingState("unpinning", pageId, false);
    }
  };

  const handleDelete = async (pageId: string) => {
    updateLoadingState("deleting", pageId, true);
    try {
      const result = await deletePage({ id: pageId });
      if (result.success) {
        // Remove from data optimistically
        setData((prev) => ({
          ...prev,
          data: prev.data.filter((page) => page.id !== pageId),
          totalCount: prev.totalCount - 1,
        }));
        // Remove from pinned if it was pinned
        setPinnedPageIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(pageId);
          return newSet;
        });
      } else {
        console.error("Failed to delete page:", result.error);
      }
    } catch (error) {
      console.error("Error deleting page:", error);
    } finally {
      updateLoadingState("deleting", pageId, false);
    }
  };

  const handleBulkDelete = async (pageIds: string[]) => {
    setBulkDeleteLoading(true);
    try {
      const result = await deleteMultiplePages({ pageIds });
      if (result.success) {
        // Remove from data optimistically
        setData((prev) => ({
          ...prev,
          data: prev.data.filter((page) => !pageIds.includes(page.id)),
          totalCount: prev.totalCount - pageIds.length,
        }));
        // Remove from pinned if any were pinned
        setPinnedPageIds((prev) => {
          const newSet = new Set(prev);
          pageIds.forEach((id) => newSet.delete(id));
          return newSet;
        });
      } else {
        console.error(
          "Failed to delete pages:",
          "error" in result ? result.error : "Unknown error",
        );
      }
    } catch (error) {
      console.error("Error deleting pages:", error);
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  // Fetch data on mount and when dependencies change
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch pinned pages on mount
  React.useEffect(() => {
    fetchPinnedPages();
  }, [fetchPinnedPages]);

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
    setSortBy(newSortBy as "title" | "created_at" | "updated_at");
    setSortOrder(newSortOrder);
  };

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
  };

  // Create columns with action handlers
  const columns = React.useMemo(
    () =>
      createColumns({
        onPin: handlePin,
        onUnpin: handleUnpin,
        onDelete: handleDelete,
        pinnedPageIds,
        loadingStates,
      }),
    [pinnedPageIds, loadingStates],
  );

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
        onPageSizeChange={handlePageSizeChange}
        onBulkDelete={handleBulkDelete}
        loading={loading}
        bulkDeleteLoading={bulkDeleteLoading}
      />
    </div>
  );
}
