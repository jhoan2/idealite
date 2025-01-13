"use server";

import { db } from "~/server/db";
import { usersResources } from "~/server/db/schema";
import { auth } from "~/app/auth";
import { z } from "zod";
import { and, eq } from "drizzle-orm";

const deleteUserResourceSchema = z.object({
  resourceId: z.string().uuid(),
});

export async function deleteUserResource(
  input: z.infer<typeof deleteUserResourceSchema>,
) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const { resourceId } = deleteUserResourceSchema.parse(input);

    await db
      .delete(usersResources)
      .where(
        and(
          eq(usersResources.resource_id, resourceId),
          eq(usersResources.user_id, session.user.id),
        ),
      );

    return { success: true };
  } catch (error) {
    console.error("Error deleting user resource relation:", error);
    throw new Error("Failed to delete user resource relation");
  }
}
