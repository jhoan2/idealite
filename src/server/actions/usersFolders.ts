"use server";

import { auth } from "~/app/auth";
import {
  folders,
  pages,
  pages_tags,
  resourcesPages,
  users_folders,
  users_pages,
} from "../db/schema";
import { db } from "../db";
import { eq, sql, and, isNull } from "drizzle-orm";
import { deleteTabMatchingPageTitle } from "./tabs";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";

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

export async function deleteFolder({ id }: { id: string }) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  try {
    // First get all pages in the folder and subfolders
    const folderPages = await db
      .select({
        id: pages.id,
        title: pages.title,
      })
      .from(pages)
      .where(eq(pages.folder_id, id));

    await db.transaction(async (tx) => {
      // First, delete all pages in the folder
      for (const page of folderPages) {
        // Delete all related records for the page
        await tx.delete(pages_tags).where(eq(pages_tags.page_id, page.id));
        await tx
          .delete(resourcesPages)
          .where(eq(resourcesPages.page_id, page.id));
        await tx.delete(users_pages).where(eq(users_pages.page_id, page.id));
        await tx.delete(pages).where(eq(pages.id, page.id));

        // Delete associated tab outside the transaction since it's not part of the database
        await deleteTabMatchingPageTitle(page.title);
      }

      // Then delete the folder relation
      await tx.delete(users_folders).where(eq(users_folders.folder_id, id));

      // Finally delete the folder
      await tx.delete(folders).where(eq(folders.id, id));
    });

    revalidatePath("/workspace");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting folder:", error);
    return {
      success: false,
      error: "Failed to delete folder",
    };
  }
}

export async function createFolder({
  name,
  tagId,
  parentFolderId,
}: {
  name?: string;
  tagId: string;
  parentFolderId?: string;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  try {
    // Get count of existing "New Folder" names in the parent folder
    const existingFolders = await db
      .select({ name: folders.name })
      .from(folders)
      .where(
        and(
          eq(folders.tag_id, tagId),
          eq(folders.user_id, userId),
          parentFolderId
            ? eq(folders.parent_folder_id, parentFolderId)
            : isNull(folders.parent_folder_id),
          sql`lower(${folders.name}) LIKE 'new folder%'`,
        ),
      );

    const newName =
      existingFolders.length === 0
        ? "New Folder"
        : `New Folder ${existingFolders.length}`;

    const folderId = uuidv4();

    await db.transaction(async (tx) => {
      await tx.insert(folders).values({
        id: folderId,
        name: name || newName,
        tag_id: tagId,
        user_id: userId,
        parent_folder_id: parentFolderId || null,
      });

      await tx.insert(users_folders).values({
        user_id: userId,
        folder_id: folderId,
        is_collapsed: false,
      });
    });

    revalidatePath("/workspace");
    return {
      success: true,
      folderId,
    };
  } catch (error) {
    console.error("Error creating folder:", error);
    return {
      success: false,
      error: "Failed to create folder",
    };
  }
}
