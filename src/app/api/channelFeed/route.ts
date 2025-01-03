import { NextRequest, NextResponse } from "next/server";
import { channelId } from "../../constants";

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const NEYNAR_API_URL =
  "https://api.neynar.com/v2/farcaster/feed/channels?channel_ids=idealite";

async function fetchNeynarAPI(url: string) {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      api_key: NEYNAR_API_KEY as string,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Neynar API error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fid = searchParams.get("fid");
  const cursor = searchParams.get("cursor");

  if (!fid) {
    return NextResponse.json({ error: "fid is required" }, { status: 400 });
  }

  try {
    let url = new URL(NEYNAR_API_URL);
    url.searchParams.append("viewer_fid", fid);
    url.searchParams.append("limit", "10");
    url.searchParams.append("reply_depth", "3");
    url.searchParams.append("with_replies", "true");
    url.searchParams.append("include_chronological_parent_casts", "false");
    url.searchParams.append("type", "hash");

    if (cursor) {
      url.searchParams.append("cursor", cursor);
    }

    const conversationResponse = await fetchNeynarAPI(url.toString());
    return NextResponse.json(conversationResponse);
  } catch (error) {
    console.error("Error fetching event feed:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching the event feed" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const { signer_uuid, text, embeds, parent, parent_author_fid } =
    await req.json();

  if (!signer_uuid || !text) {
    return NextResponse.json(
      { error: "Missing required fields in request body" },
      { status: 400 },
    );
  }

  const postOptions = {
    method: "POST",
    headers: {
      accept: "application/json",
      "x-api-key": process.env.NEYNAR_API_KEY!,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      embeds,
      signer_uuid,
      text,
      parent,
      channel_id: channelId,
      parent_author_fid: parent_author_fid,
    }),
  };

  try {
    const response = await fetch(
      "https://api.neynar.com/v2/farcaster/cast",
      postOptions,
    );
    await response.json();
    return NextResponse.json({ message: "success" });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "An error occurred while creating the cast" },
      { status: 500 },
    );
  }
}
