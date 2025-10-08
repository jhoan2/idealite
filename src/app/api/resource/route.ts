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

    // Handle YouTube URLs
    if (query.includes("youtube.com") || query.includes("youtu.be")) {
      let videoId;

      if (query.includes("youtube.com")) {
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
        `${process.env.NEXT_PUBLIC_DEPLOYMENT_URL}/api/youtube?videoId=${videoId}`,
      );
      return NextResponse.json(await youtubeData.json());
    }

    // Handle non-YouTube URLs
    if (!query.includes("youtube.com")) {
      const cleanedUrl = cleanUrl(query);

      const openGraphData = await fetch(
        `${process.env.NEXT_PUBLIC_DEPLOYMENT_URL}/api/openGraph?url=${cleanedUrl}`,
      );
      const resourceData = await openGraphData.json();
      const result = resourceData.result;

      const metadata = {
        openGraph: {
          siteName: result.ogSiteName,
          locale: result.ogLocale,
          images: result.ogImage
            ? result.ogImage.map((img: any) => ({
                url: img.url,
                width: img.width,
                height: img.height,
                alt: img.alt,
                type: img.type,
              }))
            : [],
          videos: result.ogVideo
            ? result.ogVideo.map((vid: any) => ({
                url: vid.url,
                width: vid.width,
                height: vid.height,
                type: vid.type,
              }))
            : [],
          audio: result.ogAudio || [],
          tags: result.articleTag || [],
          section: result.articleSection,
          publishedTime: result.articlePublishedTime,
          modifiedTime: result.articleModifiedTime,
          author: result.articleAuthor,
        },
        twitter: {
          card: result.twitterCard,
          site: result.twitterSite,
          creator: result.twitterCreator,
          title: result.twitterTitle,
          description: result.twitterDescription,
          image: result.twitterImage,
        },
        favicon: result.favicon,
        charset: result.charset,
        requestUrl: result.requestUrl,
        success: result.success,
      };

      const publishedDate = result.datePublished
        ? new Date(result.datePublished)
        : undefined;

      return NextResponse.json({
        author: result.author,
        title: result.ogTitle,
        description: result.ogDescription,
        image: result.ogImage?.[0]?.url,
        url: result.ogUrl || cleanedUrl,
        type: "url",
        og_type: result.ogType,
        date_published: publishedDate,
        metadata: metadata,
      });
    }
  }
}
