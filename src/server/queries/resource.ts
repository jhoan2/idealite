"use server";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { resources, resourcesPages } from "~/server/db/schema";
import { auth } from "~/app/auth";

export type Resource = typeof resources.$inferSelect;

export async function getResourcesForPage(pageId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const result = await db.query.resourcesPages.findMany({
    where: eq(resourcesPages.page_id, pageId),
    with: {
      resource: true,
    },
  });

  // Transform the result into the expected format
  return result.map(({ resource }) => ({
    id: resource.id,
    title: resource.title,
    url: resource.url,
    description: resource.description,
    author: resource.author,
    date_published: resource.date_published,
    image: resource.image,
    type: resource.type,
  }));
}
