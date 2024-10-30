import { eq, and } from "drizzle-orm";
import { db } from "~/server/db";
import {
  pages,
  users_tags,
  pages_tags,
  resourcesPages,
} from "~/server/db/schema";
import { auth } from "~/app/auth";

export async function getPageForUser(pageId: string) {
  const session = await auth();
  const userId = session?.user?.id;

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
