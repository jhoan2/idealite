import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const encodedUrl = encodeURIComponent(url);
    const response = await fetch(
      `https://publish.twitter.com/oembed?url=${encodedUrl}`,
    );
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching tweet embed:", error);
    return NextResponse.json(
      { error: "Failed to fetch tweet embed" },
      { status: 500 },
    );
  }
}
