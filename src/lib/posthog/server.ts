import { PostHog } from "posthog-node";

const posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_HOST!, {
  host: "https://us.i.posthog.com",
});

export const trackEvent = (
  fid: number,
  event: string,
  properties: Record<string, unknown>,
) => {
  if (process.env.NEXT_PUBLIC_POSTHOG_DISABLED === "true") {
    return;
  }
  posthog.capture({
    distinctId: fid.toString(),
    event,
    properties,
  });
};
