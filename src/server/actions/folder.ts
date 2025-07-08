// src/server/actions/folder.ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "~/server/db";
import { folders } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";

const renameFolderSchema = z.object({
  folderId: z.string().uuid(),
  newName: z.string().min(1).max(255),
});

export async function renameFolder(input: z.infer<typeof renameFolderSchema>) {
  try {
    const user = await currentUser();
    const userId = user?.externalId;

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedInput = renameFolderSchema.parse(input);
    const trimmedName = validatedInput.newName.trim();

    // Update the folder name (ensuring user owns the folder through the tag relationship)
    const [updatedFolder] = await db
      .update(folders)
      .set({
        name: trimmedName,
        updated_at: new Date(),
      })
      .where(eq(folders.id, validatedInput.folderId))
      .returning();

    if (!updatedFolder) {
      return { success: false, error: "Folder not found or unauthorized" };
    }

    // Revalidate the workspace page to reflect changes
    revalidatePath("/workspace");

    return { success: true, data: updatedFolder };
  } catch (error) {
    console.error("Error renaming folder:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to rename folder",
    };
  }
}
