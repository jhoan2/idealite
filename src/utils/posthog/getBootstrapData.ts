import { PostHog } from "posthog-node";
import { cookies } from "next/headers";
import { generateId } from "./genId";

export interface BootstrapData {
  distinctID: string;
  featureFlags: Record<string, string | boolean>;
}

/**
 * Get PostHog bootstrap data for server-side feature flag bootstrapping.
 * This fetches feature flags on the server and passes them to the client
 * to prevent flickering when loading feature flag-dependent content.
 */
export async function getBootstrapData(): Promise<BootstrapData> {
  let distinct_id = "";
  const phProjectAPIKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (!phProjectAPIKey) {
    throw new Error("NEXT_PUBLIC_POSTHOG_KEY is not defined");
  }

  // Construct the PostHog cookie name
  const phCookieName = `ph_${phProjectAPIKey}_posthog`;
  const cookieStore = cookies();
  const phCookie = (await cookieStore).get(phCookieName);

  // Try to get distinct_id from existing PostHog cookie
  if (phCookie) {
    try {
      const phCookieParsed = JSON.parse(phCookie.value) as {
        distinct_id?: string;
      };
      distinct_id = phCookieParsed.distinct_id ?? "";
    } catch (error) {
      console.error("Error parsing PostHog cookie:", error);
    }
  }

  // Generate new distinct_id if none exists
  if (!distinct_id) {
    distinct_id = generateId();
  }

  // Initialize PostHog client and fetch feature flags
  const client = new PostHog(phProjectAPIKey, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
  });

  try {
    const flags = await client.getAllFlags(distinct_id);
    await client.shutdown();

    return {
      distinctID: distinct_id,
      featureFlags: flags,
    };
  } catch (error) {
    console.error("Error fetching PostHog feature flags:", error);
    await client.shutdown();

    // Return empty flags on error
    return {
      distinctID: distinct_id,
      featureFlags: {},
    };
  }
}
