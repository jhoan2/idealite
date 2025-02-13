"use server";

import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { auth } from "~/app/auth";
import { revalidatePath } from "next/cache";

export async function incrementUserPoints(points: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await db
    .update(users)
    .set({
      points: sql`${users.points} + ${points}`,
    })
    .where(eq(users.id, session.user.id));

  revalidatePath("/play");
}

export async function incrementUserCash(cash: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  await db
    .update(users)
    .set({
      cash: sql`${users.cash} + ${cash}`,
    })
    .where(eq(users.id, session.user.id));

  revalidatePath("/play");
}
