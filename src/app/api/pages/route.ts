import { NextResponse } from "next/server";
import { getPageForUser } from "~/server/queries/page";
import { updatePage } from "~/server/actions/page";

export async function PUT(request: Request) {
  const url = new URL(request.url);
  const pageId = url.searchParams.get("pageId");

  if (!pageId) {
    return NextResponse.json(
      { error: "Page ID is required in query parameters" },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();
    const updatedPage = await updatePage(pageId, body);
    return NextResponse.json(updatedPage);
  } catch (error) {
    console.error("Error updating page:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
