"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { BlogPostsDataTable } from "./data-table";
import { createColumns } from "./columns";
import {
  getAllBlogPostsForAdmin,
  PaginatedBlogPostsResult,
} from "~/server/queries/blog";
import {
  deleteBlogPost,
  deleteMultipleBlogPosts,
} from "~/server/actions/blog";

export default function AdminBlogPage() {
  const [data, setData] = React.useState<PaginatedBlogPostsResult>({
    data: [],
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    pageSize: 10,
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Loading states
  const [loadingStates, setLoadingStates] = React.useState({
    deleting: new Set<number>(),
  });
  const [bulkDeleteLoading, setBulkDeleteLoading] = React.useState(false);

  // Table control state
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [sortBy, setSortBy] = React.useState<
    "title" | "createdAt" | "publishedAt"
  >("createdAt");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [search, setSearch] = React.useState("");
  const [publishedFilter, setPublishedFilter] = React.useState<
    "all" | "published" | "draft"
  >("all");

  // Fetch data function
  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getAllBlogPostsForAdmin({
        page: currentPage,
        pageSize,
        sortBy,
        sortOrder,
        search: search.trim(),
        publishedFilter,
      });

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching blog posts:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, sortBy, sortOrder, search, publishedFilter]);

  // Helper function to update loading states
  const updateLoadingState = (
    type: keyof typeof loadingStates,
    postId: number,
    isLoading: boolean,
  ) => {
    setLoadingStates((prev) => {
      const newSet = new Set(prev[type]);
      if (isLoading) {
        newSet.add(postId);
      } else {
        newSet.delete(postId);
      }
      return { ...prev, [type]: newSet };
    });
  };

  // Action handlers
  const handleDelete = async (postId: number) => {
    updateLoadingState("deleting", postId, true);
    try {
      const result = await deleteBlogPost({ id: postId });
      if (result.success) {
        // Remove from data optimistically
        setData((prev) => ({
          ...prev,
          data: prev.data.filter((post) => post.id !== postId),
          totalCount: prev.totalCount - 1,
        }));
      } else {
        console.error("Failed to delete post:", result.error);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    } finally {
      updateLoadingState("deleting", postId, false);
    }
  };

  const handleBulkDelete = async (postIds: number[]) => {
    setBulkDeleteLoading(true);
    try {
      const result = await deleteMultipleBlogPosts({ ids: postIds });
      if (result.success) {
        // Remove from data optimistically
        setData((prev) => ({
          ...prev,
          data: prev.data.filter((post) => !postIds.includes(post.id)),
          totalCount: prev.totalCount - postIds.length,
        }));
      } else {
        console.error(
          "Failed to delete posts:",
          "error" in result ? result.error : "Unknown error",
        );
      }
    } catch (error) {
      console.error("Error deleting posts:", error);
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  // Fetch data on mount and when dependencies change
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset to page 1 when search, sort, filter, or page size changes
  React.useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchData();
    }
  }, [sortBy, sortOrder, search, pageSize, publishedFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSortChange = (
    newSortBy: string,
    newSortOrder: "asc" | "desc",
  ) => {
    setSortBy(newSortBy as "title" | "createdAt" | "publishedAt");
    setSortOrder(newSortOrder);
  };

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
  };

  const handlePublishedFilterChange = (
    filter: "all" | "published" | "draft",
  ) => {
    setPublishedFilter(filter);
  };

  // Create columns with action handlers
  const columns = React.useMemo(
    () =>
      createColumns({
        onDelete: handleDelete,
        loadingStates,
      }),
    [loadingStates],
  );

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading blog posts
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Posts</h1>
          <p className="text-muted-foreground">
            Manage and publish your blog content
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/blog/new">Create New Post</Link>
        </Button>
      </div>

      <BlogPostsDataTable
        columns={columns}
        data={data}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
        onSearchChange={handleSearchChange}
        onPageSizeChange={handlePageSizeChange}
        onPublishedFilterChange={handlePublishedFilterChange}
        onBulkDelete={handleBulkDelete}
        loading={loading}
        bulkDeleteLoading={bulkDeleteLoading}
        publishedFilter={publishedFilter}
      />
    </div>
  );
}
