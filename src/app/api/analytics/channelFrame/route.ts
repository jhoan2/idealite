import { NextResponse } from "next/server";
import { trackEvent } from "~/lib/posthog/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { event, fid, displayName, username } = body;

    if (!event || !fid) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Use the existing trackEvent function from lib
    trackEvent(event, { fid, displayName, username });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to track analytics" },
      { status: 500 },
    );
  }
}
