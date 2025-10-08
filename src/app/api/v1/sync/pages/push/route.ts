// src/app/api/v1/sync/pages/push/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { pages, users_pages } from "~/server/db/schema";
import { eq, and, or, like } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";

// Request/Response schemas - ADD metadata fields
const createPageSchema = z.object({
  client_id: z.number(),
  title: z.string(),
  content: z.string().nullable(),
  content_type: z.enum(["page", "canvas"]),
  description: z.string().nullable().optional(),
  image_previews: z.array(z.string()).optional(),
  canvas_image_cid: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted: z.boolean().default(false),
});

const updatePageSchema = z.object({
  server_id: z.string().uuid(),
  title: z.string().optional(),
  content: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  image_previews: z.array(z.string()).optional(),
  canvas_image_cid: z.string().nullable().optional(),
  updated_at: z.string(),
  deleted: z.boolean().optional(),
});

const pushRequestSchema = z.object({
  creates: z.array(createPageSchema).default([]),
  updates: z.array(updatePageSchema).default([]),
  last_synced_at: z.string().optional(),
});

type CreatePage = z.infer<typeof createPageSchema>;
type UpdatePage = z.infer<typeof updatePageSchema>;

// Helper function to escape special regex characters
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Generate unique title by checking existing titles for a user
async function generateUniqueTitle(
  tx: any,
  userId: string,
  proposedTitle: string,
): Promise<string> {
  const existingTitles = await tx
    .select({ title: pages.title })
    .from(pages)
    .innerJoin(users_pages, eq(users_pages.page_id, pages.id))
    .where(
      and(
        eq(users_pages.user_id, userId),
        eq(pages.deleted, false),
        or(
          eq(pages.title, proposedTitle),
          like(pages.title, `${proposedTitle} %`),
        ),
      ),
    );

  if (existingTitles.length === 0) {
    return proposedTitle;
  }

  const usedNumbers = new Set<number>();
  let hasExactMatch = false;

  for (const row of existingTitles) {
    if (row.title === proposedTitle) {
      hasExactMatch = true;
      usedNumbers.add(1);
    } else {
      const escapedTitle = escapeRegex(proposedTitle);
      const regex = new RegExp(`^${escapedTitle} (\\d+)$`);
      const match = row.title.match(regex);

      if (match) {
        const number = parseInt(match[1], 10);
        if (!isNaN(number)) {
          usedNumbers.add(number);
        }
      }
    }
  }

  if (usedNumbers.size === 0) {
    return proposedTitle;
  }

  let nextNumber = hasExactMatch ? 2 : 1;
  while (usedNumbers.has(nextNumber)) {
    nextNumber++;
  }

  if (nextNumber === 1) {
    return proposedTitle;
  }

  return `${proposedTitle} ${nextNumber}`;
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.externalId;
    const body = await request.json();
    const { creates, updates, last_synced_at } = pushRequestSchema.parse(body);

    const result = {
      success: true,
      created: [] as Array<{
        client_id: number;
        server_id: string;
        updated_at: string;
        final_title: string;
        canvas_image_cid: string | null;
        description: string | null;
        image_previews: string[];
      }>,
      updated: [] as Array<{
        server_id: string;
        updated_at: string;
        canvas_image_cid: string | null;
        description: string | null;
        image_previews: string[];
      }>,
      conflicts: [] as Array<{
        server_id: string;
        server_updated_at: string;
        client_updated_at: string;
        server_page?: any;
      }>,
    };

    await db.transaction(async (tx) => {
      // Handle creates
      for (const createData of creates) {
        try {
          const uniqueTitle = await generateUniqueTitle(
            tx,
            userId,
            createData.title,
          );

          const [newPage] = await tx
            .insert(pages)
            .values({
              title: uniqueTitle,
              content: createData.content,
              content_type: createData.content_type,
              // ADD: Include metadata fields
              canvas_image_cid: createData.canvas_image_cid || null,
              description: createData.description || null,
              image_previews: createData.image_previews || [],
              deleted: createData.deleted,
              created_at: new Date(createData.created_at),
              updated_at: new Date(),
            })
            .returning();

          if (!newPage) {
            throw new Error("Failed to create page");
          }

          await tx.insert(users_pages).values({
            user_id: userId,
            page_id: newPage.id,
            role: "owner",
          });

          result.created.push({
            client_id: createData.client_id,
            server_id: newPage.id,
            updated_at: newPage.updated_at!.toISOString(),
            final_title: uniqueTitle,
            // ADD: Include metadata in response
            canvas_image_cid: newPage.canvas_image_cid,
            description: newPage.description,
            image_previews: newPage.image_previews || [],
          });
        } catch (error) {
          Sentry.captureException(error, {
            tags: { operation: "sync_create_page" },
            extra: {
              client_id: createData.client_id,
              userId,
              original_title: createData.title,
            },
          });
        }
      }

      // Handle updates
      for (const updateData of updates) {
        try {
          const userPage = await tx.query.users_pages.findFirst({
            where: and(
              eq(users_pages.page_id, updateData.server_id),
              eq(users_pages.user_id, userId),
            ),
          });

          if (!userPage) {
            continue;
          }

          const currentPage = await tx.query.pages.findFirst({
            where: eq(pages.id, updateData.server_id),
          });

          if (!currentPage) {
            continue;
          }

          const serverUpdatedAt = currentPage.updated_at!;
          const clientUpdatedAt = new Date(updateData.updated_at);
          const lastSyncedAt = last_synced_at
            ? new Date(last_synced_at)
            : new Date(0);

          if (
            serverUpdatedAt > lastSyncedAt &&
            serverUpdatedAt > clientUpdatedAt
          ) {
            result.conflicts.push({
              server_id: updateData.server_id,
              server_updated_at: serverUpdatedAt.toISOString(),
              client_updated_at: updateData.updated_at,
              server_page: {
                title: currentPage.title,
                content: currentPage.content,
                content_type: currentPage.content_type,
                // ADD: Include metadata in conflicts
                canvas_image_cid: currentPage.canvas_image_cid,
                description: currentPage.description,
                image_previews: currentPage.image_previews,
                updated_at: currentPage.updated_at,
                deleted: currentPage.deleted,
              },
            });
            continue;
          }

          const updateFields: any = {
            updated_at: new Date(),
          };

          if (updateData.title !== undefined) {
            updateFields.title = updateData.title;
          }
          if (updateData.content !== undefined) {
            updateFields.content = updateData.content;
          }
          // ADD: Handle metadata updates
          if (updateData.description !== undefined) {
            updateFields.description = updateData.description;
          }
          if (updateData.canvas_image_cid !== undefined) {
            updateFields.canvas_image_cid = updateData.canvas_image_cid;
          }
          if (updateData.image_previews !== undefined) {
            updateFields.image_previews = updateData.image_previews;
          }
          if (updateData.deleted !== undefined) {
            updateFields.deleted = updateData.deleted;
          }

          const [updatedPage] = await tx
            .update(pages)
            .set(updateFields)
            .where(eq(pages.id, updateData.server_id))
            .returning();

          if (updatedPage) {
            result.updated.push({
              server_id: updateData.server_id,
              updated_at: updatedPage.updated_at!.toISOString(),
              // ADD: Include metadata in response
              description: updatedPage.description,
              image_previews: updatedPage.image_previews || [],
              canvas_image_cid: updatedPage.canvas_image_cid,
            });
          }
        } catch (error) {
          Sentry.captureException(error, {
            tags: { operation: "sync_update_page" },
            extra: { server_id: updateData.server_id, userId },
          });
        }
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in sync push:", error);
    Sentry.captureException(error, {
      tags: { api: "sync", operation: "push" },
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
