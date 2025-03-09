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

  return result.map(({ resource }) => resource);
}

export async function findResourceByUrl(url: string) {
  const resource = await db.query.resources.findFirst({
    where: eq(resources.url, url),
  });
  return resource;
}
