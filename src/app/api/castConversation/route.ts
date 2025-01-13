import "server-only";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const eventCastHash = searchParams.get("hash");
  const fId = searchParams.get("fId");
  const cursor = searchParams.get("cursor");

  if (!eventCastHash) {
    return NextResponse.json(
      { error: "eventCastHash is required" },
      { status: 400 },
    );
  }

  if (!fId) {
    return NextResponse.json({ error: "fId is required" }, { status: 400 });
  }

  try {
    const fIdInt = parseInt(fId);
    let url = `https://api.neynar.com/v2/farcaster/cast/conversation?type=hash&reply_depth=2&include_chronological_parent_casts=false&limit=2&viewer_fid=${fIdInt}&identifier=${eventCastHash}`;

    if (cursor) {
      url += `&cursor=${cursor}`;
    }

    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        api_key: process.env.NEYNAR_API_KEY!,
      },
    };

    const response = await fetch(url, options);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "An error occurred while fetching the event feed" },
      { status: 500 },
    );
  }
}
