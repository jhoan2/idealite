// src/app/api/v1/pages/[id]/tags/[tagId]/route.ts
import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { removeTagFromPage } from "~/server/actions/page";
import * as Sentry from "@sentry/nextjs";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; tagId: string } },
) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await removeTagFromPage(params.id, params.tagId);

    if (result.error) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json(result);
  } catch (error) {
    console.error("Error removing tag from page:", error);
    Sentry.captureException(error, {
      tags: {
        component: "RemoveTagFromPageAPI",
        action: "remove_tag",
      },
      extra: {
        pageId: params.id,
        tagId: params.tagId,
      },
    });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
