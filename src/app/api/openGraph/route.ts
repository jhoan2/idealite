import { NextRequest, NextResponse } from "next/server";
import ogs from "open-graph-scraper";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const { result, error } = await ogs({ url: url });

    if (error) {
      console.log(error);
      return NextResponse.json({ message: error }, { status: 500 });
    }
    return NextResponse.json({ result: result });
  } catch (error) {
    console.error("Error fetching open graph data:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching open graph data" },
      { status: 500 },
    );
  }
}
