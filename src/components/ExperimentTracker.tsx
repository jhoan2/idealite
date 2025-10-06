"use client";

import { useExperimentTracking } from "~/hooks/useExperimentTracking";

interface ExperimentTrackerProps {
  experimentName: string;
  variant: string;
}

export function ExperimentTracker({
  experimentName,
  variant,
}: ExperimentTrackerProps) {
  useExperimentTracking(experimentName, variant);
  return null;
}
