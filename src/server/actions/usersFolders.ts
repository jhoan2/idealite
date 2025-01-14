"use server";

import { auth } from "~/app/auth";
import { users_folders } from "../db/schema";
import { db } from "../db";

export async function updateFolderCollapsed({
  folderId,
  isCollapsed,
}: {
  folderId: string;
  isCollapsed: boolean;
}) {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: "User not authenticated" };
    }

    await db
      .insert(users_folders)
      .values({
        user_id: session.user?.id ?? "",
        folder_id: folderId,
        is_collapsed: isCollapsed,
      })
      .onConflictDoUpdate({
        target: [users_folders.user_id, users_folders.folder_id],
        set: { is_collapsed: isCollapsed },
      });

    return { success: true };
  } catch (error) {
    console.error("Error updating folder collapse state:", error);
    return { success: false, error: "Failed to update folder state" };
  }
}
