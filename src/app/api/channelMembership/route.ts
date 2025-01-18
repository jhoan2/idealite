import { NextRequest, NextResponse } from "next/server";
import { inviteToChannel, checkIfMember } from "~/server/farcaster";
import { trackEvent } from "~/lib/posthog/client";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.fid) {
      return NextResponse.json(
        { error: "Missing required field: fid, Sign in!" },
        { status: 400 },
      );
    }

    // Ensure fid is a valid number/string
    const fid = String(body.fid);
    if (!fid.match(/^\d+$/)) {
      return NextResponse.json(
        { error: "Invalid fid format" },
        { status: 400 },
      );
    }

    const isMember = await checkIfMember(fid);
    if (isMember) {
      return NextResponse.json(
        { error: "User is already a member of the channel" },
        { status: 400 },
      );
    }

    const response = await inviteToChannel(Number(fid));
    if (!response.success) {
      return NextResponse.json({ error: response.message }, { status: 500 });
    }

    trackEvent("channel_joined", {
      fid: fid,
    });

    return NextResponse.json({ success: true, data: response });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
