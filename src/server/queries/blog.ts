"use server";

import { eq, desc, asc, like, and, count, or } from "drizzle-orm";
import { db } from "~/server/db";
import { blogPosts } from "~/server/db/schema";
import { currentUser } from "@clerk/nextjs/server";

export type BlogPostTableData = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  published: boolean | null;
  publishedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type PaginatedBlogPostsResult = {
  data: BlogPostTableData[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
};

/**
 * Get all blog posts for admin view with pagination and filtering
 */
export async function getAllBlogPostsForAdmin(
  params: {
    page?: number;
    pageSize?: number;
    sortBy?: "title" | "createdAt" | "publishedAt";
    sortOrder?: "asc" | "desc";
    search?: string;
    publishedFilter?: "all" | "published" | "draft";
  } = {},
): Promise<PaginatedBlogPostsResult> {
  const user = await currentUser();

  if (!user || user.publicMetadata.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }

  const {
    page = 1,
    pageSize = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    search = "",
    publishedFilter = "all",
  } = params;

  const offset = (page - 1) * pageSize;

  // Build where conditions
  const whereConditions = [];

  // Add search condition
  if (search.trim()) {
    whereConditions.push(
      or(
        like(blogPosts.title, `%${search.trim()}%`),
        like(blogPosts.slug, `%${search.trim()}%`),
      ),
    );
  }

  // Add published filter
  if (publishedFilter === "published") {
    whereConditions.push(eq(blogPosts.published, true));
  } else if (publishedFilter === "draft") {
    whereConditions.push(eq(blogPosts.published, false));
  }

  // Build sort condition
  const getSortColumn = () => {
    switch (sortBy) {
      case "title":
        return blogPosts.title;
      case "publishedAt":
        return blogPosts.publishedAt;
      case "createdAt":
      default:
        return blogPosts.createdAt;
    }
  };

  const sortColumn = getSortColumn();
  const orderBy = sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

  // Get total count
  const whereClause =
    whereConditions.length > 0 ? and(...whereConditions) : undefined;

  const totalCountResult = await db
    .select({ count: count() })
    .from(blogPosts)
    .where(whereClause);

  const totalCount = totalCountResult[0]?.count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Get paginated posts
  const posts = await db
    .select()
    .from(blogPosts)
    .where(whereClause)
    .orderBy(orderBy)
    .limit(pageSize)
    .offset(offset);

  return {
    data: posts,
    totalCount,
    totalPages,
    currentPage: page,
    pageSize,
  };
}

/**
 * Get a single blog post by ID (admin only)
 */
export async function getBlogPostById(id: number) {
  const user = await currentUser();

  if (!user || user.publicMetadata.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }

  const post = await db.query.blogPosts.findFirst({
    where: eq(blogPosts.id, id),
  });

  return post;
}

/**
 * Get published blog posts for public view with pagination
 */
export async function getPublishedBlogPosts(
  params: {
    page?: number;
    pageSize?: number;
  } = {},
): Promise<PaginatedBlogPostsResult> {
  const { page = 1, pageSize = 10 } = params;

  const offset = (page - 1) * pageSize;

  // Only show published posts
  const whereClause = eq(blogPosts.published, true);

  // Get total count
  const totalCountResult = await db
    .select({ count: count() })
    .from(blogPosts)
    .where(whereClause);

  const totalCount = totalCountResult[0]?.count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Get paginated posts, ordered by most recent first
  const posts = await db
    .select()
    .from(blogPosts)
    .where(whereClause)
    .orderBy(desc(blogPosts.publishedAt))
    .limit(pageSize)
    .offset(offset);

  return {
    data: posts,
    totalCount,
    totalPages,
    currentPage: page,
    pageSize,
  };
}

/**
 * Get a single published blog post by slug for public view
 */
export async function getBlogPostBySlug(slug: string) {
  const post = await db.query.blogPosts.findFirst({
    where: and(eq(blogPosts.slug, slug), eq(blogPosts.published, true)),
  });

  return post;
}
