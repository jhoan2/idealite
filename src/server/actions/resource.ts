"use server";

import { db } from "~/server/db";
import { resources, resourcesPages, usersResources } from "~/server/db/schema";
import { auth } from "~/app/auth";
import { z } from "zod";

const createResourceSchema = z.object({
  author: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  id: z.string().optional(),
  image: z.string().url().optional(),
  favicon: z.string().url().optional(),
  og_site_name: z.string().optional(),
  og_type: z.string().optional(),
  type: z.enum(["url", "crossref", "open_library"]),
  url: z.string().url("Invalid URL"),
  date_published: z.date().optional(),
  page_id: z.string(),
});

export type CreateResourceInput = z.infer<typeof createResourceSchema>;

export async function createResource(input: CreateResourceInput) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const validatedInput = createResourceSchema.parse(input);

    const [resource] = await db
      .insert(resources)
      .values({
        ...validatedInput,
      })
      .returning();

    await db.insert(usersResources).values({
      user_id: session.user.id,
      resource_id: resource?.id || "",
    });

    await db.insert(resourcesPages).values({
      page_id: validatedInput.page_id,
      resource_id: resource?.id || "",
    });

    return resource;
  } catch (error) {
    console.error("Error creating resource:", error);
    throw new Error("Failed to create resource");
  }
}
