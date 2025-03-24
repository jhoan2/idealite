"use server";

import { db } from "~/server/db";
import { resourcesPages } from "~/server/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
const deleteResourcePageSchema = z.object({
  resourceId: z.string().uuid(),
  pageId: z.string().uuid(),
});

export async function deleteResourcePage(
  input: z.infer<typeof deleteResourcePageSchema>,
) {
  const user = await currentUser();
  const userId = user?.externalId;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const { resourceId, pageId } = deleteResourcePageSchema.parse(input);

    await db
      .delete(resourcesPages)
      .where(
        sql`${resourcesPages.resource_id} = ${resourceId} AND ${resourcesPages.page_id} = ${pageId}`,
      );

    revalidatePath(`/workspace/${pageId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting resource page relation:", error);
    throw new Error("Failed to delete resource page relation");
  }
}
