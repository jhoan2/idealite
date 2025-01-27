import { NextRequest, NextResponse } from "next/server";
import { cleanUrl } from "~/lib/url";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");

  if (type === "url") {
    const query = searchParams.get("query");

    if (!type || !query) {
      return NextResponse.json(
        { error: "Type and query parameters are required" },
        { status: 400 },
      );
    }

    if (query.includes("youtube.com") || query.includes("youtu.be")) {
      let videoId;
      if (query.includes("youtube.com")) {
        // Handle both watch URLs and share URLs
        const urlParams = new URL(query).searchParams;
        videoId = urlParams.get("v");
        if (!videoId) {
          throw new Error(
            "Invalid YouTube URL: Could not extract video ID from youtube.com URL",
          );
        }
      }

      if (query.includes("youtu.be")) {
        const id = query.split("youtu.be/")[1]?.split(/[#?]/)[0];
        if (!id) {
          throw new Error(
            "Invalid YouTube URL: Could not extract video ID from youtu.be URL",
          );
        }
        videoId = id;
      }

      if (!videoId) {
        throw new Error("Invalid YouTube URL");
      }

      const youtubeData = await fetch(
        `${process.env.APP_URL}/api/youtube?videoId=${videoId}`,
      );
      return NextResponse.json(await youtubeData.json());
    }

    if (!query.includes("youtube.com")) {
      const cleanedUrl = cleanUrl(query);

      const openGraphData = await fetch(
        `${process.env.APP_URL}/api/openGraph?url=${cleanedUrl}`,
      );
      const resourceData = await openGraphData.json();
      const publishedDate = new Date(resourceData.result.datePublished);

      return NextResponse.json({
        author: resourceData.result.author,
        title: resourceData.result.ogTitle,
        description: resourceData.result.ogDescription,
        image: resourceData.result.ogImage?.[0]?.url,
        url: resourceData.result.ogUrl,
        type: "url",
        og_type: resourceData.result.ogType,
        date_published: publishedDate,
      });
    }
  }
}
