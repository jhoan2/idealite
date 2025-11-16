import Hero from "./(landing)/Hero";
import Progress from "./(landing)/Progress";
import Footer from "./(landing)/Footer";
import GetStarted from "./(landing)/GetStarted";
import FeatureSection from "./(landing)/FeatureSection";
import { GoogleTag } from "~/components/GoogleTag";
import { HeroTransformation } from "~/components/landing/HeroTransformation";
import { VariantTracker } from "~/components/VariantTracker";
import { getBootstrapData } from "~/utils/posthog/getBootstrapData";

export default async function FrontPage() {
  // Get feature flags server-side to prevent flicker
  const bootstrapData = await getBootstrapData();
  const flagValue = bootstrapData.featureFlags["digital-method-of-loci"];

  // PostHog returns "test" (string) or false (boolean) for 50/50 split
  // Map false to "control" for consistency
  const variant = flagValue === "test" ? "test" : "control";

  // Select Hero component based on server-side feature flag
  const HeroComponent = variant === "test" ? HeroTransformation : Hero;

  return (
    <div className="min-h-screen bg-black text-gray-800">
      <GoogleTag />
      <VariantTracker flagName="digital-method-of-loci" variant={variant} />
      <HeroComponent />
      <main>
        <FeatureSection />
        <Progress />
        <GetStarted variant={variant} />
      </main>
      <Footer />
    </div>
  );
}
