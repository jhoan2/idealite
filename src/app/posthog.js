// app/posthog.js
import { PostHog } from "posthog-node";

export default function PostHogClient() {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_POSTHOG_KEY is not defined");
  }
  const posthogClient = new PostHog(apiKey, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  });
  posthogClient.debug(true);
  return posthogClient;
}
