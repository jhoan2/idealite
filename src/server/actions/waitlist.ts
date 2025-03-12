"use server";

import { db } from "~/server/db";
import { waitlist } from "~/server/db/schema";
import { Client, resend } from "@upstash/qstash";
import { eq } from "drizzle-orm";
import { EmailTemplate } from "~/components/emails/WaitlistEmail";

const qstashClient = new Client({
  token: process.env.QSTASH_TOKEN || "",
});

export async function joinWaitlist(formData: FormData) {
  const email = formData.get("email") as string;
  const name = (formData.get("name") as string) || "";

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return { success: false, message: "Please provide a valid email address." };
  }

  try {
    // Check if email already exists
    const existingUser = await db
      .select()
      .from(waitlist)
      .where(eq(waitlist.email, email));

    if (existingUser.length > 0) {
      return {
        success: true,
        message: "You're already on our waitlist! We'll be in touch soon.",
      };
    }

    // // Add to waitlist
    await db.insert(waitlist).values({
      email,
      name: name || null,
    });

    // Send confirmation email using QStash's Resend integration
    await qstashClient.publishJSON({
      api: {
        name: "email",
        provider: resend({
          token: process.env.RESEND_API_KEY || "",
        }),
      },
      body: {
        from: `Idealite <${process.env.RESEND_FROM_EMAIL}>`,
        to: [email],
        subject: "Welcome to the Idealite Waitlist!",
        react: EmailTemplate({
          name: name || "there",
          email: email,
        }),
        replyTo: process.env.RESEND_REPLY_TO_EMAIL,
      },
      retry: {
        retries: 3,
        backoff: {
          type: "exponential",
          factor: 2,
          minMs: 1000,
          maxMs: 60000,
        },
      },
    });

    return {
      success: true,
      message:
        "Thanks for joining our waitlist! Check your email for confirmation.",
    };
  } catch (error) {
    console.error("Error adding to waitlist:", error);
    return {
      success: false,
      message: "Something went wrong. Please try again.",
    };
  }
}
