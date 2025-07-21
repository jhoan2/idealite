// src/app/api/v1/tags/create-page/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createPage } from "~/server/actions/page";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";

const createPageSchema = z.object({
  title: z.string(),
  tagId: z.string().uuid(),
  hierarchy: z.array(z.string().uuid()),
  folderId: z.string().uuid().nullable().optional(),
  type: z.enum(["page", "canvas"]).default("page"),
});

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, tagId, hierarchy, folderId, type } =
      createPageSchema.parse(body);

    const result = await createPage(
      {
        title,
        tag_id: tagId,
        hierarchy,
        folder_id: folderId || null,
      },
      type,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating page:", error);
    return NextResponse.json(
      { error: "Failed to create page" },
      { status: 500 },
    );
  }
}
