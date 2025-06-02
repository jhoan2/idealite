"use server";

import { eq, and } from "drizzle-orm";
import { db } from "~/server/db";
import {
  pages,
  users_tags,
  pages_tags,
  resourcesPages,
  tags,
  Tag,
  users_pages,
} from "~/server/db/schema";
import { currentUser } from "@clerk/nextjs/server";

export async function getPageForUser(pageId: string) {
  const user = await currentUser();
  const userId = user?.externalId;

  if (!userId) {
    throw new Error("User not authenticated");
  }

  const result = await db.query.pages.findFirst({
    where: and(eq(pages.id, pageId), eq(pages.deleted, false)),
    with: {
      // Get tags through the pages_tags relation
      tags: {
        with: {
          tag: true,
        },
        // Only get tags that the user has access to
        where: (pagesTags, { exists, and, eq }) =>
          exists(
            db
              .select()
              .from(users_tags)
              .where(
                and(
                  eq(users_tags.tag_id, pagesTags.tag_id),
                  eq(users_tags.user_id, userId),
                ),
              ),
          ),
      },
      // Get resources through the resourcesPages relation
      resources: {
        with: {
          resource: true,
        },
      },
    },
  });

  if (!result || result.tags.length === 0) {
    return null;
  }

  // Transform the result into the expected format
  return {
    id: result.id,
    title: result.title,
    content: result.content,
    created_at: result.created_at,
    updated_at: result.updated_at,
    tags: result.tags.map(({ tag }) => ({
      id: tag.id,
      name: tag.name,
    })),
    resources: result.resources.map(({ resource }) => ({
      id: resource.id,
      title: resource.title,
      url: resource.url,
      description: resource.description,
      author: resource.author,
      date_published: resource.date_published,
      image: resource.image,
      type: resource.type,
    })),
  };
}

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
