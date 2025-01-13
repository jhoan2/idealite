import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get("videoId");

  if (!videoId) {
    return NextResponse.json(
      { error: "Video ID is required" },
      { status: 400 },
    );
  }

  try {
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    if (!youtubeApiKey) {
      throw new Error("YouTube API key not configured");
    }

    const videoApiResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet,statistics&id=${videoId}&key=${youtubeApiKey}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    const videoJsonResponse = await videoApiResponse.json();
    console.log(videoJsonResponse, "videoJsonResponse");

    if (videoJsonResponse.items.length === 0) {
      throw new Error(`Video (${videoId}) cannot be fetched from API`);
    }

    const videoData = videoJsonResponse.items[0];
    const publishedDate = new Date(videoData.snippet.publishedAt).toISOString();
    return NextResponse.json({
      title: videoData.snippet.title,
      description: videoData.snippet.description,
      image: videoData.snippet.thumbnails.high.url,
      date_published: publishedDate,
      author: videoData.snippet.channelTitle,
      type: "url",
      url: `https://www.youtube.com/watch?v=${videoId}`,
      og_type: "video",
    });
  } catch (error) {
    console.error("Error fetching YouTube data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch YouTube video metadata",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
