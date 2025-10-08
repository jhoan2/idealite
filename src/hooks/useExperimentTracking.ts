"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { usePathname } from "next/navigation";

/**
 * Hook to track A/B test experiments with PostHog
 * Automatically captures experiment variant on page load
 */
export function useExperimentTracking(experimentName: string, variant: string) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined" && posthog.__loaded) {
      // Track experiment started event
      posthog.capture("$experiment_started", {
        experiment_name: experimentName,
        variant: variant,
        $set: {
          [`experiment_${experimentName}`]: variant,
        },
      });

      // Set feature flag for this experiment
      posthog.register({
        [`experiment_${experimentName}`]: variant,
      });
    }
  }, [experimentName, variant, pathname]);
}

/**
 * Track conversion events for A/B tests
 */
export function trackConversion(eventName: string, properties?: Record<string, unknown>) {
  if (typeof window !== "undefined" && posthog.__loaded) {
    posthog.capture(eventName, properties);
  }
}
