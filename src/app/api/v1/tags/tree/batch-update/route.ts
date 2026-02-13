// app/api/v1/tags/tree/batch-update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { updateTagCollapsed } from "~/server/actions/usersTags";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";

const batchUpdateSchema = z.object({
  tags: z
    .array(
      z.object({
        id: z.string().uuid(),
        isCollapsed: z.boolean(),
      }),
    )
    .optional()
    .default([]),
});

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    const userId = user?.externalId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tags } = batchUpdateSchema.parse(body);

    console.log(`Processing batch update for user ${userId}:`, {
      tagsCount: tags.length,
    });

    // Process tag updates in parallel
    const tagResults = await Promise.allSettled(
      tags.map(async ({ id, isCollapsed }) => {
        try {
          const result = await updateTagCollapsed({
            tagId: id,
            isCollapsed,
          });

          if (!result.success) {
            throw new Error(result.error || `Failed to update tag ${id}`);
          }

          return { id, success: true };
        } catch (error) {
          console.error(`Failed to update tag ${id}:`, error);
          return {
            id,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      }),
    );

    // Count successes and failures
    const tagSuccesses = tagResults.filter(
      (result) => result.status === "fulfilled" && result.value.success,
    ).length;

    const tagFailures = tagResults.filter(
      (result) =>
        result.status === "rejected" ||
        (result.status === "fulfilled" && !result.value.success),
    );

    // Log failures for debugging
    if (tagFailures.length > 0) {
      console.warn("Batch update had some failures:", {
        tagFailures: tagFailures.length,
        tagFailureDetails: tagFailures,
      });

      Sentry.captureMessage("Batch update partial failure", {
        level: "warning",
        tags: {
          component: "batch-update-api",
          operation: "partial-failure",
          userId,
        },
        extra: {
          tagFailures: tagFailures.length,
          totalTags: tags.length,
          failureDetails: {
            tags: tagFailures,
          },
        },
      });
    }

    // Prepare response
    const response = {
      success: true,
      results: {
        tags: {
          total: tags.length,
          successful: tagSuccesses,
          failed: tagFailures.length,
        },
      },
      // Include failure details if any
      ...(tagFailures.length > 0
        ? {
            failures: {
              tags: tagFailures.map((f) =>
                f.status === "fulfilled"
                  ? f.value
                  : { error: "Promise rejected" },
              ),
            },
          }
        : {}),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in batch update:", error);

    Sentry.captureException(error, {
      tags: {
        component: "batch-update-api",
        operation: "batch-update",
      },
      extra: {
        url: request.url,
        method: request.method,
      },
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update tree state",
      },
      { status: 500 },
    );
  }
}
