import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { tryCatch } from "~/lib/tryCatch";
import { Webhook } from "svix";

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, return error
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse("Error: Missing svix headers", { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Webhook instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");

  let evt: WebhookEvent;

  // Verify the webhook
  const { data: event, error } = await tryCatch(
    Promise.resolve(
      wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent,
    ),
  );

  if (error || !event) {
    console.error("Error verifying webhook:", error);
    return new NextResponse("Error verifying webhook", { status: 400 });
  }

  evt = event;

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, username, image_url, first_name, last_name } = evt.data;

    // Insert the new user into the database
    const { error: dbError } = await tryCatch(
      db.insert(users).values({
        display_name:
          first_name && last_name
            ? `${first_name} ${last_name}`
            : first_name || username || id,
        pfp_url: image_url,
        role: "user",
      }),
    );

    if (dbError) {
      console.error("Error inserting user:", dbError);
      return new NextResponse("Error inserting user", { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  // Return a response for other event types
  return NextResponse.json({ success: true });
}

export const GET = () => {
  return new NextResponse("Clerk webhook endpoint is working", { status: 200 });
};
