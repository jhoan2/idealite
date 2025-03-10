"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { markFeatureDiscovered } from "~/server/actions/featureDiscovery";
import { getUserDiscoveredFeatures } from "~/server/queries/featureDiscovery";

// Define feature keys for consistency
export enum FeatureKey {
  RIGHT_SIDEBAR = "right_sidebar",
  CARD_CREATION = "card_creation",
  IMAGE_GENERATOR = "image_generator",
  CANVAS_EDITOR = "canvas_editor",
  TAG_MANAGEMENT = "tag_management",
  GLOBAL_TAGS = "global_tags",
  TAG_TREE_NAVIGATION = "tag_tree_navigation",
}

type FeatureDiscoveryContextType = {
  discoveredFeatures: Set<string>;
  isDiscovered: (featureKey: string) => boolean;
  markDiscovered: (featureKey: string) => Promise<void>;
  showTour: boolean;
  setShowTour: (show: boolean) => void;
  currentTourStep: number;
  setCurrentTourStep: (step: number) => void;
};

const FeatureDiscoveryContext =
  createContext<FeatureDiscoveryContextType | null>(null);

export function FeatureDiscoveryProvider({
  children,
  userId,
  initialDiscoveredFeatures = [],
}: {
  children: ReactNode;
  userId: string;
  initialDiscoveredFeatures?: string[];
}) {
  const [discoveredFeatures, setDiscoveredFeatures] = useState<Set<string>>(
    new Set(initialDiscoveredFeatures),
  );
  const [showTour, setShowTour] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState(0);

  // Load discovered features on mount
  useEffect(() => {
    if (userId) {
      getUserDiscoveredFeatures(userId).then((features) => {
        setDiscoveredFeatures(new Set(features));
      });
    }
  }, [userId]);

  const isDiscovered = (featureKey: string) => {
    return discoveredFeatures.has(featureKey);
  };

  const markDiscovered = async (featureKey: string) => {
    if (userId) {
      const result = await markFeatureDiscovered(userId, featureKey);
      if (result.success) {
        setDiscoveredFeatures((prev) => new Set([...prev, featureKey]));
      }
    }
  };

  return (
    <FeatureDiscoveryContext.Provider
      value={{
        discoveredFeatures,
        isDiscovered,
        markDiscovered,
        showTour,
        setShowTour,
        currentTourStep,
        setCurrentTourStep,
      }}
    >
      {children}
    </FeatureDiscoveryContext.Provider>
  );
}

export function useFeatureDiscovery() {
  const context = useContext(FeatureDiscoveryContext);
  if (!context) {
    throw new Error(
      "useFeatureDiscovery must be used within a FeatureDiscoveryProvider",
    );
  }
  return context;
}
