import { NextResponse } from "next/server";
import { getPageForUser } from "~/server/queries/page";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pageId = url.searchParams.get("pageId");

  if (!pageId) {
    return NextResponse.json(
      { error: "Page ID is required in query parameters" },
      { status: 400 },
    );
  }

  try {
    const page = await getPageForUser(pageId);

    if (!page) {
      console.log("Page not found, returning 404");
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json(page);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
