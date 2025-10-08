"use server";
import { resources, resourcesPages, usersResources } from "~/server/db/schema";
import { eq, desc, asc, ilike, and, count } from "drizzle-orm";
import { db } from "~/server/db";
import { currentUser } from "@clerk/nextjs/server";

export type Resource = typeof resources.$inferSelect;

export async function getResourcesForPage(pageId: string) {
  const user = await currentUser();

  if (!user?.externalId) {
    throw new Error("Unauthorized");
  }

  const result = await db.query.resourcesPages.findMany({
    where: eq(resourcesPages.page_id, pageId),
    with: {
      resource: true,
    },
  });

  return result.map(({ resource }) => resource);
}

export async function findResourceByUrl(url: string) {
  const resource = await db.query.resources.findFirst({
    where: eq(resources.url, url),
  });
  return resource;
}

export type ResourceTableData = {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  image: string | null;
  type: "url" | "crossref" | "open_library";
  url: string;
  created_at: Date;
};

export type PaginatedResourcesResult = {
  data: ResourceTableData[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
};

export type ResourceQueryParams = {
  page?: number;
  pageSize?: number;
  sortBy?: "title" | "created_at" | "author";
  sortOrder?: "asc" | "desc";
  search?: string;
};

export async function getResourcesForUser({
  page = 1,
  pageSize = 10,
  sortBy = "created_at",
  sortOrder = "desc",
  search = "",
}: ResourceQueryParams = {}): Promise<PaginatedResourcesResult> {
  const user = await currentUser();

  if (!user?.externalId) {
    throw new Error("Unauthorized");
  }

  // Build the where clause
  const whereConditions = [eq(usersResources.user_id, user.externalId)];

  // Add search condition if provided
  if (search.trim()) {
    whereConditions.push(ilike(resources.title, `%${search.trim()}%`));
  }

  const whereClause = and(...whereConditions);

  // Get total count
  const totalCountResult = await db
    .select({ count: count() })
    .from(usersResources)
    .innerJoin(resources, eq(usersResources.resource_id, resources.id))
    .where(whereClause);

  const totalCount = totalCountResult[0]?.count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Determine sort column and order
  let orderBy;
  const sortColumn = resources[sortBy];

  if (sortOrder === "desc") {
    orderBy = desc(sortColumn);
  } else {
    orderBy = asc(sortColumn);
  }

  // Get paginated results
  const offset = (page - 1) * pageSize;
  const result = await db
    .select({
      id: resources.id,
      title: resources.title,
      author: resources.author,
      description: resources.description,
      image: resources.image,
      type: resources.type,
      url: resources.url,
      created_at: resources.created_at,
    })
    .from(usersResources)
    .innerJoin(resources, eq(usersResources.resource_id, resources.id))
    .where(whereClause)
    .orderBy(orderBy)
    .limit(pageSize)
    .offset(offset);

  return {
    data: result,
    totalCount,
    totalPages,
    currentPage: page,
    pageSize,
  };
}
