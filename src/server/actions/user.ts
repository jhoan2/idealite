"use server";

import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
