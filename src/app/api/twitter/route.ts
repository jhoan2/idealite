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

    return NextResponse.json({
      author: data.author_name,
      title: data.provider_name,
      description: data.html
        .split('lang="en">')[1]
        ?.split("</p>")[0]
        ?.replace(/<[^>]*>/g, "")
        .trim(),
      url: data.url,
      type: "url",
      html: data.html,
    });
  } catch (error) {
    console.error("Error fetching tweet embed:", error);
    return NextResponse.json(
      { error: "Failed to fetch tweet embed" },
      { status: 500 },
    );
  }
}
