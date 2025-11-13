"use client";

import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";

interface VariantTrackerProps {
  flagName: string;
  variant: string;
}

/**
 * Tracks feature flag impressions for PostHog experiments.
 * Fires a $feature_flag_called event when the component mounts,
 * telling PostHog which variant the user was exposed to.
 */
export function VariantTracker({ flagName, variant }: VariantTrackerProps) {
  const posthog = usePostHog();

  useEffect(() => {
    if (posthog) {
      posthog.capture("$feature_flag_called", {
        $feature_flag: flagName,
        $feature_flag_response: variant,
      });
    }
  }, [posthog, flagName, variant]);

  return null; // This component doesn't render anything
}
