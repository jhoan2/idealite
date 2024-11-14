"use server";

import { db } from "~/server/db";
import { pages, tabs, users_pages } from "~/server/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { auth } from "~/app/auth";
import { revalidatePath } from "next/cache";

export async function createTab(data: { title: string; path: string }) {
  const session = await auth();
  const user_id = session?.user?.id;

  if (!user_id) {
    return { success: false, error: "User not authenticated" };
  }

  const newTab = await db
    .insert(tabs)
    .values({
      user_id: user_id,
      title: data.title,
      path: data.path,
      is_active: true,
      position: 0,
    })
    .returning();

  revalidatePath(`/workspace/${data.path}`);

  return { success: true, id: newTab[0]?.id };
}

export async function setActiveTab(tabId: string) {
  const tab = await db.transaction(async (tx) => {
    // Deactivate all tabs
    await tx.update(tabs).set({ is_active: false });

    // Activate selected tab
    await tx.update(tabs).set({ is_active: true }).where(eq(tabs.id, tabId));
  });

  revalidatePath("/workspace");

  return tab;
}

export async function closeTab(tabId: string) {
  const session = await auth();
  const user_id = session?.user?.id;

  if (!user_id) {
    return { success: false, error: "User not authenticated" };
  }

  return await db.transaction(async (tx) => {
    // Delete the specified tab
    await tx.delete(tabs).where(eq(tabs.id, tabId));

    // If there are remaining tabs, set the first one as active
    const remainingTabs = await tx
      .select()
      .from(tabs)
      .where(eq(tabs.user_id, user_id))
      .limit(1);

    if (remainingTabs.length > 0) {
      await tx
        .update(tabs)
        .set({ is_active: true })
        .where(eq(tabs.id, remainingTabs[0]?.id ?? ""));
    }

    revalidatePath("/workspace");

    return { success: true };
  });
}

export async function updateTabTitle(tabId: string, title: string) {
  const session = await auth();
  const user_id = session?.user?.id;

  if (!user_id) {
    return { success: false, error: "User not authenticated" };
  }

  // Check if the tab belongs to the user
  const userTab = await db.query.tabs.findFirst({
    where: and(eq(tabs.user_id, user_id), eq(tabs.id, tabId)),
  });

  if (!userTab) {
    return { success: false, error: "Tab not found or unauthorized" };
  }

  // Update the tab title
  const updatedTab = await db
    .update(tabs)
    .set({ title })
    .where(eq(tabs.id, tabId))
    .returning();

  revalidatePath(`/workspace/${updatedTab[0]?.path}`);

  return { success: true, tab: updatedTab[0] };
}

export async function deleteTabMatchingPageTitle(title: string) {
  console.log(title, "title");
  const session = await auth();
  const user_id = session?.user?.id;

  if (!user_id) {
    return { success: false, error: "User not authenticated" };
  }

  try {
    // First check if the tab exists
    const existingTab = await db.query.tabs.findFirst({
      where: and(eq(tabs.title, title), eq(tabs.user_id, user_id)),
    });

    // If no tab exists, return success since the desired state is achieved
    if (!existingTab) {
      return {
        success: true,
        message: "No tab found with this title",
      };
    }

    // Delete the tab if it exists
    await db
      .delete(tabs)
      .where(and(eq(tabs.title, title), eq(tabs.user_id, user_id)));

    revalidatePath("/workspace");
    return {
      success: true,
      message: "Tab successfully deleted",
    };
  } catch (error) {
    console.error("Error in deleteTabMatchingPageTitle:", error);
    return {
      success: false,
      error: "Failed to process tab deletion request",
    };
  }
}
