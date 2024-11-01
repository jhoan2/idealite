"use server";

import { db } from "~/server/db";
import { resourcesPages } from "~/server/db/schema";
import { auth } from "~/app/auth";
import { z } from "zod";
import { sql } from "drizzle-orm";

const deleteResourcePageSchema = z.object({
  resourceId: z.string().uuid(),
  pageId: z.string().uuid(),
});

export async function deleteResourcePage(
  input: z.infer<typeof deleteResourcePageSchema>,
) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const { resourceId, pageId } = deleteResourcePageSchema.parse(input);

    await db
      .delete(resourcesPages)
      .where(
        sql`${resourcesPages.resource_id} = ${resourceId} AND ${resourcesPages.page_id} = ${pageId}`,
      );

    return { success: true };
  } catch (error) {
    console.error("Error deleting resource page relation:", error);
    throw new Error("Failed to delete resource page relation");
  }
}
