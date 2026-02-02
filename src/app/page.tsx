import type { Metadata } from "next";
import LandingGaming from "./(landing)/LandingGaming";
import { GoogleTag } from "~/components/GoogleTag";
import { VariantTracker } from "~/components/VariantTracker";
import { getBootstrapData } from "~/utils/posthog/getBootstrapData";

export const metadata: Metadata = {
  title:
    "Idealite | Gamified Learning for Autodidacts - Skill Trees, Guilds & Quests",
  description:
    "Escape the NPC loop. Join a guild of intellectually curious autodidacts. Build skill trees, complete quests, and level up your learning with the first MMORPG for self-directed education.",
  keywords: [
    "autodidact",
    "self-directed learning",
    "gamified education",
    "skill trees",
    "learning community",
    "guild learning",
    "MMORPG learning",
    "learning network",
    "RPG for self-improvement",
    "polymath community",
  ],
  openGraph: {
    title: "Idealite | The Solo Queue is Over",
    description:
      "The first MMORPG for the intellectually curious. Squad up with elite autodidacts.",
    url: "https://idealite.xyz",
    siteName: "Idealite",
    images: [
      {
        url: "https://idealite.xyz/api/og?title=The%20Solo%20Queue%20is%20Over&subtitle=The%20first%20MMORPG%20for%20the%20intellectually%20curious",
        width: 1200,
        height: 630,
        alt: "Idealite - Gamified Learning Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Idealite | The Solo Queue is Over",
    description:
      "The first MMORPG for the intellectually curious. Join the guild.",
    images: [
      "https://idealite.xyz/api/og?title=The%20Solo%20Queue%20is%20Over&subtitle=The%20first%20MMORPG%20for%20the%20intellectually%20curious",
    ],
  },
  alternates: {
    canonical: "https://idealite.xyz",
  },
  robots: {
    index: true,
    follow: true,
  },
};

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
