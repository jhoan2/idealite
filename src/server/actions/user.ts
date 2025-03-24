"use server";

import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function incrementUserPoints(points: number) {
  const user = await currentUser();
  const userId = user?.externalId;
  if (!userId) {
    throw new Error("Unauthorized");
  }

  await db
    .update(users)
    .set({
      points: sql`${users.points} + ${points}`,
    })
    .where(eq(users.id, userId));

  revalidatePath("/play");
}

export async function incrementUserCash(cash: number) {
  const user = await currentUser();
  const userId = user?.externalId;
  if (!userId) {
    throw new Error("Unauthorized");
  }
  await db
    .update(users)
    .set({
      cash: sql`${users.cash} + ${cash}`,
    })
    .where(eq(users.id, userId));

  revalidatePath("/play");
}
