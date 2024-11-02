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

const bookResourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  description: z.string().optional(),
  author: z.string().optional(),
  type: z.enum(["url", "crossref", "open_library"]),
  image: z.string().optional(),
  open_library_id: z.string().optional(),
  date_published: z.date().optional(),
  page_id: z.string(),
});

export async function createBookResource(input: CreateResourceInput) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  try {
    const validatedInput = bookResourceSchema.parse(input);

    // Check if book already exists
    const existingBook = await db.query.resources.findFirst({
      where: (resources, { and, eq }) =>
        and(
          eq(resources.open_library_id, input.id || ""),
          eq(resources.type, "open_library"),
        ),
    });

    let resourceId: string;

    if (existingBook) {
      // Use existing book's ID
      resourceId = existingBook.id;
    } else {
      // Create new book resource
      const [newResource] = await db
        .insert(resources)
        .values({
          ...validatedInput,
        })
        .returning();
      resourceId = newResource?.id || "";
    }

    // Create relations using the resource ID
    await db.insert(usersResources).values({
      user_id: session.user.id,
      resource_id: resourceId,
    });

    await db.insert(resourcesPages).values({
      page_id: validatedInput.page_id,
      resource_id: resourceId,
    });

    return (
      existingBook ||
      (await db.query.resources.findFirst({
        where: (resources, { eq }) => eq(resources.id, resourceId),
      }))
    );
  } catch (error) {
    console.error("Error creating book resource:", error);
    throw new Error("Failed to create book resource");
  }
}
