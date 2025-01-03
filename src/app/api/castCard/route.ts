import "server-only";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const hash = searchParams.get("hash");

  if (!url && !hash) {
    return NextResponse.json(
      { error: "Missing URL or hash parameter" },
      { status: 400 },
    );
  }

  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      api_key: process.env.NEYNAR_API_KEY!,
    },
  };

  try {
    const identifier = url || hash;
    const type = url ? "url" : "hash";
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/cast?identifier=${identifier}&type=${type}`,
      options,
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "An error occurred while fetching the cast" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const { signer_uuid, text, embeds, parent, parent_author_fid } =
    await req.json();

  if (!signer_uuid) {
    return NextResponse.json(
      { error: "Missing required fields in request body" },
      { status: 400 },
    );
  }

  const postOptions = {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-api-key": process.env.NEYNAR_API_KEY!,
    },
    body: JSON.stringify({
      embeds,
      signer_uuid,
      text,
      parent,
      parent_author_fid,
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

export async function PATCH(req: NextRequest) {
  const { reaction_type, signer_uuid, target, target_author_fid, idem } =
    await req.json();

  if (!reaction_type || !signer_uuid || !target || !target_author_fid) {
    return NextResponse.json(
      { error: "Missing required fields in request body" },
      { status: 400 },
    );
  }

  try {
    const options = {
      method: "POST",
      headers: {
        accept: "application/json",
        api_key: process.env.NEYNAR_API_KEY!,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        reaction_type,
        signer_uuid,
        target,
        target_author_fid,
        idem,
      }),
    };

    const response = await fetch(
      "https://api.neynar.com/v2/farcaster/reaction",
      options,
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${data.message || "Unknown error"}`,
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "An error occurred while fetching the event feed" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const eventCastHash = searchParams.get("eventCastHash");
  const { signer_uuid } = await req.json();

  if (!signer_uuid) {
    return NextResponse.json(
      { error: "signer_uuid is required in the request body" },
      { status: 400 },
    );
  }

  if (!eventCastHash) {
    return NextResponse.json(
      { error: "eventCastHash is required" },
      { status: 400 },
    );
  }

  try {
    const options = {
      method: "DELETE",
      headers: {
        accept: "application/json",
        api_key: process.env.NEYNAR_API_KEY!,
        "content-type": "application/json",
      },
      body: JSON.stringify({ signer_uuid, target_hash: eventCastHash }),
    };

    const response = await fetch(
      "https://api.neynar.com/v2/farcaster/cast",
      options,
    );
    const data = await response.json();

    if (response.ok) {
      return NextResponse.json({ message: "Cast deleted successfully", data });
    } else {
      return NextResponse.json(
        { error: "Failed to delete cast", data },
        { status: response.status },
      );
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "An error occurred while deleting the cast" },
      { status: 500 },
    );
  }
}
