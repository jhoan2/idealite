"use server";

import { eq, and, desc, asc, count, like, or, ne } from "drizzle-orm";
import { db } from "~/server/db";
import {
  pages,
  users_pages,
  pages_tags,
  tags,
  pages_edges,
} from "~/server/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { Tag } from "~/server/db/schema";

export async function getPageTagHierarchy(pageId: string) {
  try {
    // First, get all tags for this page
    const pageTags = await db.query.pages_tags.findMany({
      where: eq(pages_tags.page_id, pageId),
      with: {
        tag: true,
      },
    });

    // Function to recursively get parent tags
    async function getParentChain(tagId: string | null): Promise<Tag[]> {
      if (!tagId) return [];

      const tag = await db.query.tags.findFirst({
        where: eq(tags.id, tagId),
      });

      if (!tag) return [];

      const parents = await getParentChain(tag.parent_id);
      return [...parents, tag];
    }

    // Get parent chains for each tag
    const hierarchies = await Promise.all(
      pageTags.map(async ({ tag }) => {
        const chain = await getParentChain(tag.id);
        return chain;
      }),
    );

    // Filter out empty chains and sort by length (optional)
    const nonEmptyHierarchies = hierarchies.filter((chain) => chain.length > 0);

    // Sort hierarchies by length (optional)
    nonEmptyHierarchies.sort((a, b) => b.length - a.length);

    return nonEmptyHierarchies;
  } catch (error) {
    console.error("Error fetching tag hierarchy:", error);
    return [];
  }
}

export async function getPageContent(pageId: string) {
  const user = await currentUser();
  if (!user?.externalId) {
    throw new Error("Unauthorized");
  }

  // Check if the user has access to the page
  const userPage = await db.query.users_pages.findFirst({
    where: and(
      eq(users_pages.user_id, user.externalId),
      eq(users_pages.page_id, pageId),
    ),
  });

  if (!userPage) {
    throw new Error("Page not found or user doesn't have access");
  }

  const result = await db.query.pages.findFirst({
    where: and(eq(pages.id, pageId), eq(pages.deleted, false)),
    columns: {
      content: true,
      content_type: true,
    },
  });

  return result
    ? {
        content: result.content ?? "",
        content_type: result.content_type,
      }
    : {
        content: "",
        content_type: "page" as const,
      };
}

export async function getPageTitle(pageId: string) {
  const user = await currentUser();
  if (!user?.externalId) {
    throw new Error("Unauthorized");
  }

  // Check if the user has access to the page
  const userPage = await db.query.users_pages.findFirst({
    where: and(
      eq(users_pages.user_id, user.externalId),
      eq(users_pages.page_id, pageId),
    ),
  });

  if (!userPage) {
    throw new Error("Page not found or user doesn't have access");
  }

  const result = await db.query.pages.findFirst({
    where: and(eq(pages.id, pageId), eq(pages.deleted, false)),
    columns: {
      title: true,
    },
  });

  return result?.title ?? null;
}

export async function getPageTags(pageId: string) {
  const user = await currentUser();
  if (!user?.externalId) {
    throw new Error("Unauthorized");
  }

  // Check if the user has access to the page
  const userPage = await db.query.users_pages.findFirst({
    where: and(
      eq(users_pages.user_id, user.externalId),
      eq(users_pages.page_id, pageId),
    ),
  });

  if (!userPage) {
    throw new Error("Page not found or user doesn't have access");
  }

  const result = await db.query.pages_tags.findMany({
    where: eq(pages_tags.page_id, pageId),
    with: {
      tag: true,
    },
  });

  return result.map(({ tag }) => tag);
}

export async function getPageType(pageId: string) {
  const user = await currentUser();
  if (!user?.externalId) {
    throw new Error("Unauthorized");
  }

  // Check if the user has access to the page
  const userPage = await db.query.users_pages.findFirst({
    where: and(
      eq(users_pages.user_id, user.externalId),
      eq(users_pages.page_id, pageId),
    ),
  });

  if (!userPage) {
    throw new Error("Page not found or user doesn't have access");
  }

  const result = await db.query.pages.findFirst({
    where: and(eq(pages.id, pageId), eq(pages.deleted, false)),
    columns: {
      content_type: true,
    },
  });

  return result?.content_type ?? null;
}

export async function getPageById(pageId: string) {
  const user = await currentUser();
  if (!user?.externalId) {
    throw new Error("Unauthorized");
  }

  // Check if user has access to this page
  const userPage = await db.query.users_pages.findFirst({
    where: and(
      eq(users_pages.page_id, pageId),
      eq(users_pages.user_id, user.externalId),
    ),
  });

  if (!userPage) {
    throw new Error("Page not found or unauthorized");
  }

  const page = await db.query.pages.findFirst({
    where: eq(pages.id, pageId),
  });

  return page;
}

export type PageTableData = {
  id: string;
  title: string;
  created_at: Date;
  updated_at: Date | null;
  description: string | null;
  tags: Array<{
    id: string;
    name: string;
  }>;
};

export type PaginatedPagesResult = {
  data: PageTableData[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
};

export async function getPagesForUser(
  params: {
    page?: number;
    pageSize?: number;
    sortBy?: "title" | "created_at" | "updated_at";
    sortOrder?: "asc" | "desc";
    search?: string;
  } = {},
): Promise<PaginatedPagesResult> {
  const user = await currentUser();
  const userId = user?.externalId;

  if (!userId) {
    throw new Error("User not authenticated");
  }

  const {
    page = 1,
    pageSize = 10,
    sortBy = "updated_at",
    sortOrder = "desc",
    search = "",
  } = params;

  const offset = (page - 1) * pageSize;

  // Build the where conditions
  const whereConditions = [eq(pages.deleted, false)];

  // Add search condition if provided
  if (search.trim()) {
    whereConditions.push(like(pages.title, `%${search.trim()}%`));
  }

  // Build sort condition
  const getSortColumn = () => {
    switch (sortBy) {
      case "title":
        return pages.title;
      case "created_at":
        return pages.created_at;
      case "updated_at":
        return pages.updated_at;
      default:
        return pages.updated_at;
    }
  };

  const sortColumn = getSortColumn();
  const orderBy = sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

  // Get total count for pagination
  const totalCountResult = await db
    .select({ count: count() })
    .from(pages)
    .innerJoin(users_pages, eq(users_pages.page_id, pages.id))
    .where(and(eq(users_pages.user_id, userId), ...whereConditions));

  const totalCount = totalCountResult[0]?.count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Get paginated pages with basic info
  const pagesResult = await db
    .select({
      id: pages.id,
      title: pages.title,
      created_at: pages.created_at,
      updated_at: pages.updated_at,
      description: pages.description,
    })
    .from(pages)
    .innerJoin(users_pages, eq(users_pages.page_id, pages.id))
    .where(and(eq(users_pages.user_id, userId), ...whereConditions))
    .orderBy(orderBy)
    .limit(pageSize)
    .offset(offset);

  // Get tags for all pages in one query, excluding the root tag
  const pageIds = pagesResult.map((p) => p.id);
  const rootTagId = process.env.ROOT_TAG_ID;

  // Build tag where conditions
  const tagWhereConditions = [
    eq(tags.deleted, false),
    or(...pageIds.map((id) => eq(pages_tags.page_id, id))),
  ];

  // Add condition to exclude root tag if environment variable is set
  if (rootTagId) {
    tagWhereConditions.push(ne(tags.id, rootTagId));
  }

  const pageTagsResult = await db
    .select({
      pageId: pages_tags.page_id,
      tagId: tags.id,
      tagName: tags.name,
    })
    .from(pages_tags)
    .innerJoin(tags, eq(tags.id, pages_tags.tag_id))
    .where(and(...tagWhereConditions));

  // Group tags by page
  const tagsByPage = pageTagsResult.reduce(
    (acc, item) => {
      if (!acc[item.pageId]) {
        acc[item.pageId] = [];
      }
      acc[item.pageId]!.push({
        id: item.tagId,
        name: item.tagName,
      });
      return acc;
    },
    {} as Record<string, Array<{ id: string; name: string }>>,
  );

  // Combine pages with their tags
  const data: PageTableData[] = pagesResult.map((page) => ({
    ...page,
    tags: tagsByPage[page.id] || [],
  }));

  return {
    data,
    totalCount,
    totalPages,
    currentPage: page,
    pageSize,
  };
}

export async function getPageIncomingLinks(pageId: string): Promise<{
  success: boolean;
  links?: Array<{ id: string; title: string }>;
  error?: string;
}> {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      throw new Error("Unauthorized");
    }

    // Verify user has access to the page
    const userPage = await db.query.users_pages.findFirst({
      where: and(
        eq(users_pages.page_id, pageId),
        eq(users_pages.user_id, user.externalId),
      ),
    });

    if (!userPage) {
      throw new Error("Page not found or unauthorized");
    }

    const links = await db.query.pages_edges.findMany({
      where: eq(pages_edges.target_page_id, pageId),
      with: {
        sourcePage: {
          columns: {
            id: true,
            title: true,
          },
        },
      },
    });

    const processedLinks = links.map((link) => ({
      id: link.sourcePage.id,
      title: link.sourcePage.title,
    }));

    return {
      success: true,
      links: processedLinks,
    };
  } catch (error) {
    console.error("Error getting page incoming links:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get page backlinks",
    };
  }
}
