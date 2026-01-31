import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { tryCatch } from "~/lib/tryCatch";
import { Webhook } from "svix";
import * as Sentry from "@sentry/nextjs";
import { eq } from "drizzle-orm";

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
    const { id, username, image_url, first_name, last_name, email_addresses } =
      evt.data;

    const email = email_addresses[0]?.email_address || "";

    // Check if a user with this email already exists (e.g., created via Discord)
    const { data: existingUser, error: lookupError } = await tryCatch(
      db.query.users.findFirst({
        where: eq(users.email, email),
      }),
    );

    if (lookupError) {
      console.error("Error looking up existing user:", lookupError);
      Sentry.captureException(lookupError);
    }

    if (existingUser) {
      // Link Clerk account to existing Discord-created user
      const { error: linkError } = await tryCatch(
        db
          .update(users)
          .set({ clerk_id: id })
          .where(eq(users.id, existingUser.id)),
      );

      if (linkError) {
        console.error("Error linking Clerk to existing user:", linkError);
        return new NextResponse("Error linking accounts", { status: 500 });
      }

      // Update Clerk user with the existing database ID as externalId
      const { error: clerkError } = await tryCatch(
        fetch(`https://api.clerk.dev/v1/users/${id}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            external_id: existingUser.id,
          }),
        }),
      );

      if (clerkError) {
        console.error("Error updating Clerk user:", clerkError);
        Sentry.captureException(clerkError);
      }

      return NextResponse.json({ success: true, linked: true });
    }

    // No existing user found - create a new one
    const { data: insertResult, error: dbError } = await tryCatch(
      db
        .insert(users)
        .values({
          display_name:
            first_name && last_name
              ? `${first_name} ${last_name}`
              : first_name || username || id,
          pfp_url: image_url,
          role: "user",
          clerk_id: id,
          email: email,
        })
        .returning({ id: users.id }),
    );

    if (dbError) {
      console.error("Error inserting user:", dbError);
      return new NextResponse("Error inserting user", { status: 500 });
    }

    // Get the newly created database user ID
    const databaseUserId = insertResult[0]?.id;

    // Update Clerk user with your database ID as externalId using Clerk API directly
    const { error: clerkError } = await tryCatch(
      fetch(`https://api.clerk.dev/v1/users/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          external_id: databaseUserId as string,
        }),
      }),
    );

    if (clerkError) {
      console.error("Error updating Clerk user:", clerkError);
      Sentry.captureException(clerkError);
    }

    return NextResponse.json({ success: true });
  }

  if (eventType === "waitlistEntry.created" || eventType === "waitlistEntry.updated") {
    const waitlistData = evt.data;

    // Send Discord notification
    if (process.env.DISCORD_WEBHOOK_URL) {
      const { error: discordError } = await tryCatch(
        fetch(process.env.DISCORD_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            embeds: [
              {
                title: `🎉 Waitlist Entry ${eventType === "waitlistEntry.created" ? "Created" : "Updated"}`,
                color: eventType === "waitlistEntry.created" ? 0x00ff00 : 0xffa500,
                fields: [
                  {
                    name: "Email",
                    value: waitlistData.email_address || "N/A",
                    inline: true,
                  },
                  {
                    name: "Event Type",
                    value: eventType,
                    inline: true,
                  },
                  {
                    name: "Timestamp",
                    value: new Date().toISOString(),
                    inline: false,
                  },
                ],
                footer: {
                  text: "Idealite Waitlist",
                },
              },
            ],
          }),
        }),
      );

      if (discordError) {
        console.error("Error sending Discord notification:", discordError);
        Sentry.captureException(discordError);
        // Don't fail the webhook if Discord notification fails
      }
    }

    return NextResponse.json({ success: true });
  }

  // Return a response for other event types
  return NextResponse.json({ success: true });
}

export const GET = () => {
  return new NextResponse("Clerk webhook endpoint is working", { status: 200 });
};
