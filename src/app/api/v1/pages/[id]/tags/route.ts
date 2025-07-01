// src/app/api/v1/pages/[id]/tags/route.ts
import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { addTagToPage } from "~/server/actions/page";
import * as Sentry from "@sentry/nextjs";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tagId } = body;

    if (!tagId) {
      return Response.json({ error: "tagId is required" }, { status: 400 });
    }

    const result = await addTagToPage(params.id, tagId);

    if (result.error) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json(result);
  } catch (error) {
    console.error("Error adding tag to page:", error);
    Sentry.captureException(error, {
      tags: {
        component: "AddTagToPageAPI",
        action: "add_tag",
      },
      extra: {
        pageId: params.id,
      },
    });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
