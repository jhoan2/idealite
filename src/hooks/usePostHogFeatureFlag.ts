"use client";

import { useEffect, useState } from "react";
import { usePostHog } from "posthog-js/react";

/**
 * Hook to get a PostHog feature flag value with loading state
 * @param flagName - The name of the feature flag
 * @param defaultValue - Default value to return while loading or if flag doesn't exist
 * @returns Object with variant (current flag value) and isLoading state
 */
export function usePostHogFeatureFlag(
  flagName: string,
  defaultValue: string = "control",
) {
  const posthog = usePostHog();
  const [variant, setVariant] = useState<string>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If PostHog is not initialized, use default
    if (!posthog || typeof window === "undefined") {
      setVariant(defaultValue);
      setIsLoading(false);
      return;
    }

    // Check if PostHog is loaded
    if (!posthog.__loaded) {
      setVariant(defaultValue);
      setIsLoading(false);
      return;
    }

    // Wait for feature flags to load
    posthog.onFeatureFlags(() => {
      const flagValue = posthog.getFeatureFlag(flagName);
      setVariant((flagValue as string) || defaultValue);
      setIsLoading(false);
    });

    // If flags are already loaded, get the value immediately
    const currentFlag = posthog.getFeatureFlag(flagName);
    if (currentFlag !== undefined) {
      setVariant((currentFlag as string) || defaultValue);
      setIsLoading(false);
    }
  }, [posthog, flagName, defaultValue]);

  return { variant, isLoading };
}
