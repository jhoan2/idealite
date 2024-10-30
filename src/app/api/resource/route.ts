import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { resources } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import ogs from "open-graph-scraper";
import { cleanUrl } from "~/lib/utils";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");
  const query = searchParams.get("query");

  if (!type || !query) {
    return NextResponse.json(
      { error: "Type and query parameters are required" },
      { status: 400 },
    );
  }

  if (type === "url") {
    const cleanedUrl = cleanUrl(query);

    // First, check if the resource exists in our database
    const existingResource = await db.query.resources.findFirst({
      where: eq(resources.url, cleanedUrl),
    });

    if (existingResource) {
      return NextResponse.json({
        author: existingResource.author,
        title: existingResource.title,
        description: existingResource.description,
        image: existingResource.image,
        date_published: existingResource.date_published,
        favicon: existingResource.favicon,
        og_type: existingResource.og_type,
        type: existingResource.type,
        url: existingResource.url,
        id: existingResource.id,
      });
    }

    // If not found in database, fetch from OpenGraph
    try {
      const { result, error } = await ogs({ url: cleanedUrl });

      if (error) {
        console.error("OpenGraph error:", error);
        return NextResponse.json(
          { error: "Failed to fetch resource metadata" },
          { status: 500 },
        );
      }
      const response = {
        author: result.author || "",
        title: result.ogTitle || result.twitterTitle || "",
        description: result.ogDescription || result.twitterDescription || "",
        image: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url,
        favicon: result.favicon || "",
        og_site_name: result.ogSiteName || "",
        og_type: result.ogType || "",
        type: "url",
        url: result.ogUrl || cleanedUrl,
      };

      return NextResponse.json(response);
    } catch (error) {
      console.error("Error fetching resource:", error);
      return NextResponse.json(
        { error: "Failed to fetch resource metadata" },
        { status: 500 },
      );
    }
  }

  if (type === "book") {
  }

  if (type === "research-paper") {
  }
}
