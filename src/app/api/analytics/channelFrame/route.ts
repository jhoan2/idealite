import { NextResponse } from "next/server";
import { trackEvent } from "~/lib/posthog/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { distinctId, event, properties } = body;

    if (!event || !distinctId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Use the existing trackEvent function from lib
    trackEvent(distinctId, event, properties);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to track analytics" },
      { status: 500 },
    );
  }
}
