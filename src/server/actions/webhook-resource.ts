// server/actions/webhook-resource.ts
import { db } from "~/server/db";
import { resources, resourcesPages, usersResources } from "~/server/db/schema";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";

// Schema for webhook resource creation (no user auth needed)
const webhookResourceSchema = z.object({
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
  user_id: z.string(), // Required for webhook context
});

const webhookBookResourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  description: z.string().optional(),
  author: z.string().optional(),
  type: z.enum(["url", "crossref", "open_library"]),
  image: z.string().optional(),
  open_library_id: z.string().optional(),
  date_published: z.date().optional(),
  page_id: z.string(),
  user_id: z.string(), // Required for webhook context
});

export type WebhookResourceInput = z.infer<typeof webhookResourceSchema>;
export type WebhookBookResourceInput = z.infer<
  typeof webhookBookResourceSchema
>;

// Webhook-compatible version of createResource
export async function createResourceFromWebhook(input: WebhookResourceInput) {
  try {
    const validatedInput = webhookResourceSchema.parse(input);

    // Check if resource already exists
    const existingResource = await db.query.resources.findFirst({
      where: (resources, { and, eq }) =>
        and(
          eq(resources.url, validatedInput.url),
          eq(resources.type, validatedInput.type),
        ),
    });

    let resourceId: string;

    if (existingResource) {
      resourceId = existingResource.id;

      // Create relations if they don't exist
      await db
        .insert(usersResources)
        .values({
          user_id: validatedInput.user_id,
          resource_id: existingResource.id,
        })
        .onConflictDoNothing();

      await db
        .insert(resourcesPages)
        .values({
          page_id: validatedInput.page_id,
          resource_id: existingResource.id,
        })
        .onConflictDoNothing();

      return existingResource;
    } else {
      // Create new resource if it doesn't exist
      const { user_id, ...resourceData } = validatedInput;

      const [resource] = await db
        .insert(resources)
        .values(resourceData)
        .returning();

      resourceId = resource?.id || "";

      await db.insert(usersResources).values({
        user_id: validatedInput.user_id,
        resource_id: resource?.id || "",
      });

      await db.insert(resourcesPages).values({
        page_id: validatedInput.page_id,
        resource_id: resource?.id || "",
      });

      return resource;
    }
  } catch (error) {
    console.error("Error creating resource from webhook:", error);
    Sentry.captureException(error, {
      tags: {
        action: "createResourceFromWebhook",
        type: "webhook",
      },
      extra: {
        input,
      },
    });
    throw new Error("Failed to create resource from webhook");
  }
}

// Webhook-compatible version of createBookResource
export async function createBookResourceFromWebhook(
  input: WebhookBookResourceInput,
) {
  try {
    const validatedInput = webhookBookResourceSchema.parse(input);

    // Check if book already exists by open_library_id
    const existingBook = await db.query.resources.findFirst({
      where: (resources, { and, eq }) =>
        and(
          eq(resources.open_library_id, validatedInput.open_library_id || ""),
          eq(resources.type, "open_library"),
        ),
    });

    let resourceId: string;

    if (existingBook) {
      // Use existing book's ID
      resourceId = existingBook.id;
    } else {
      // Create new book resource
      const { user_id, ...resourceData } = validatedInput;

      const [newResource] = await db
        .insert(resources)
        .values(resourceData)
        .returning();

      resourceId = newResource?.id || "";
    }

    // Create relations using the resource ID
    await db
      .insert(usersResources)
      .values({
        user_id: validatedInput.user_id,
        resource_id: resourceId,
      })
      .onConflictDoNothing();

    await db
      .insert(resourcesPages)
      .values({
        page_id: validatedInput.page_id,
        resource_id: resourceId,
      })
      .onConflictDoNothing();

    // Return the resource
    return (
      existingBook ||
      (await db.query.resources.findFirst({
        where: (resources, { eq }) => eq(resources.id, resourceId),
      }))
    );
  } catch (error) {
    console.error("Error creating book resource from webhook:", error);
    Sentry.captureException(error, {
      tags: {
        action: "createBookResourceFromWebhook",
        type: "webhook",
      },
      extra: {
        input,
      },
    });
    throw new Error("Failed to create book resource from webhook");
  }
}

// Helper function for URL metadata processing (used in your workflow)
export async function processUrlResourceFromWebhook(
  url: string,
  userId: string,
  pageId: string,
  metadata?: {
    title?: string;
    description?: string;
    author?: string;
    image?: string;
    og_type?: string;
    date_published?: Date;
  },
) {
  return createResourceFromWebhook({
    title: metadata?.title || url,
    url: url.trim(),
    description: metadata?.description || "",
    author: metadata?.author,
    image: metadata?.image,
    og_type: metadata?.og_type,
    date_published: metadata?.date_published,
    type: "url",
    page_id: pageId,
    user_id: userId,
  });
}

// Helper function for book processing (used in your workflow)
export async function processBookResourceFromWebhook(
  bookData: {
    title: string;
    author?: string;
    open_library_id?: string;
    url: string;
    description?: string;
    image?: string;
    date_published?: Date;
  },
  userId: string,
  pageId: string,
) {
  return createBookResourceFromWebhook({
    title: bookData.title,
    author: bookData.author || "",
    open_library_id: bookData.open_library_id,
    url: bookData.url,
    description: bookData.description || "",
    image: bookData.image,
    date_published: bookData.date_published,
    type: "open_library",
    page_id: pageId,
    user_id: userId,
  });
}
