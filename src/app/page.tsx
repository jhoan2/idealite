import LandingGaming from "./(landing)/LandingGaming";
import { GoogleTag } from "~/components/GoogleTag";
import { VariantTracker } from "~/components/VariantTracker";
import { getBootstrapData } from "~/utils/posthog/getBootstrapData";

export default async function FrontPage() {
  // Get feature flags server-side to prevent flicker
  const bootstrapData = await getBootstrapData();
  const flagValue = bootstrapData.featureFlags["digital-method-of-loci"];

  // PostHog returns "test" (string) or false (boolean) for 50/50 split
  // Map false to "control" for consistency
  const variant = flagValue === "test" ? "test" : "control";

  return (
    <>
      <GoogleTag />
      <VariantTracker flagName="digital-method-of-loci" variant={variant} />
      <LandingGaming variant={variant} />
    </>
  );
}
