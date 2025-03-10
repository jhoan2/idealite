"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ArrowRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useRouter } from "next/navigation";
import { markFeatureDiscovered } from "~/server/actions/featureDiscovery";
import { hasDiscoveredFeature } from "~/server/queries/featureDiscovery";
import { useSession } from "next-auth/react";

// Define tour steps
enum TourStep {
  SELECT_TAG = 0,
  CREATE_PAGE = 1,
  NAVIGATE_TO_PAGE = 2,
  COMPLETED = 3,
}

// Define feature key for database storage
const TOUR_FEATURE_KEY = "global_tags_tour";

export function GlobalTagsTour({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState<TourStep>(TourStep.SELECT_TAG);
  const [isVisible, setIsVisible] = useState(true);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [createdPageId, setCreatedPageId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // Check if the tour has been completed before
  useEffect(() => {
    async function checkTourCompletion() {
      if (!userId) return;

      try {
        const isDiscovered = await hasDiscoveredFeature(
          userId,
          TOUR_FEATURE_KEY,
        );

        if (isDiscovered) {
          setCurrentStep(TourStep.COMPLETED);
          setIsVisible(false);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Error checking tour completion:", error);
        // Fallback to visible state if error occurs
        setIsInitialized(true);
      }
    }

    checkTourCompletion();
  }, [userId]);

  // Mark the tour as completed in the database
  const completeTour = useCallback(async () => {
    if (!userId) return;

    try {
      const result = await markFeatureDiscovered(userId, TOUR_FEATURE_KEY);

      if (result.success) {
        setCurrentStep(TourStep.COMPLETED);
        setIsVisible(false);
      } else {
        console.error("Failed to mark tour as completed:", result.error);
      }
    } catch (error) {
      console.error("Error marking tour as completed:", error);
    }
  }, [userId]);

  // Track tag selection events
  useEffect(() => {
    const handleTagAdded = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log("Tag added event received:", customEvent.detail);

      if (currentStep === TourStep.SELECT_TAG) {
        setSelectedTagId(customEvent.detail.tagId);
        setCurrentStep(TourStep.CREATE_PAGE);
      }
    };

    window.addEventListener("tag-added", handleTagAdded as EventListener);
    return () => {
      window.removeEventListener("tag-added", handleTagAdded as EventListener);
    };
  }, [currentStep]);

  // Track page creation events
  useEffect(() => {
    const handlePageCreated = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log("Page created event received:", customEvent.detail);

      if (currentStep === TourStep.CREATE_PAGE) {
        setCreatedPageId(customEvent.detail.pageId);
        setCurrentStep(TourStep.NAVIGATE_TO_PAGE);
      }
    };

    window.addEventListener("page-created", handlePageCreated as EventListener);
    return () => {
      window.removeEventListener(
        "page-created",
        handlePageCreated as EventListener,
      );
    };
  }, [currentStep]);

  // Skip the current step (for testing or impatient users)
  const skipStep = () => {
    if (currentStep < TourStep.COMPLETED) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  // Skip the entire tour
  const skipTour = () => {
    completeTour().catch(console.error);
  };

  // Show loading state while checking database
  if (!isInitialized) {
    return <>{children}</>;
  }

  // If tour is completed, just render children
  if (currentStep === TourStep.COMPLETED || !isVisible) {
    return <>{children}</>;
  }

  return (
    <>
      {children}

      {/* Step 1: Click on a circle */}
      {currentStep === TourStep.SELECT_TAG && (
        <div className="pointer-events-none fixed inset-0 z-[9999]">
          <div
            className="pointer-events-auto absolute left-1/2 top-1/4 w-80 -translate-x-1/2 rounded-lg border border-border bg-card p-4 shadow-lg"
            style={{
              animation: "pulse 2s infinite",
            }}
          >
            <div className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-l border-t border-border bg-card"></div>
            <div className="mb-2 flex items-start justify-between">
              <h4 className="text-lg font-medium">Step 1: Add a Tag</h4>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={skipTour}
                aria-label="Close tour"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Click on any circle in the visualization to add that tag to your
              workspace.
            </p>
            <div className="mt-2 flex justify-between">
              <Button variant="outline" size="sm" onClick={skipTour}>
                Skip Tour
              </Button>
              <Button size="sm" onClick={skipStep} className="gap-1">
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Right-click on tag */}
      {currentStep === TourStep.CREATE_PAGE && (
        <div className="pointer-events-none fixed inset-0 z-[9999]">
          <div className="pointer-events-auto absolute left-64 top-40 w-80 rounded-lg border border-border bg-card p-4 shadow-lg">
            <div className="absolute -left-2 top-10 h-4 w-4 rotate-45 border-b border-l border-border bg-card"></div>
            <div className="mb-2 flex items-start justify-between">
              <h4 className="text-lg font-medium">Step 2: Create a Page</h4>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={skipTour}
                aria-label="Close tour"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Right-click on the tag you just added in the navigation panel,
              then select "Create page".
            </p>
            <div className="mt-2 flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(TourStep.SELECT_TAG)}
              >
                Previous
              </Button>
              <Button size="sm" onClick={skipStep} className="gap-1">
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Click on page */}
      {currentStep === TourStep.NAVIGATE_TO_PAGE && (
        <div className="pointer-events-none fixed inset-0 z-[9999]">
          <div className="pointer-events-auto absolute left-64 top-60 w-80 rounded-lg border border-border bg-card p-4 shadow-lg">
            <div className="absolute -left-2 top-10 h-4 w-4 rotate-45 border-b border-l border-border bg-card"></div>
            <div className="mb-2 flex items-start justify-between">
              <h4 className="text-lg font-medium">Step 3: Open Your Page</h4>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={skipTour}
                aria-label="Close tour"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Click on your newly created page to navigate to it and start
              taking notes.
            </p>
            <div className="mt-2 flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(TourStep.CREATE_PAGE)}
              >
                Previous
              </Button>
              <Button size="sm" onClick={completeTour}>
                Finish
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed controls at bottom of screen */}
      <div className="fixed bottom-4 right-4 z-[9999] flex gap-2">
        <Button variant="outline" size="sm" onClick={skipTour}>
          Skip Tour
        </Button>
      </div>

      {/* Add custom styles for animation */}
      <style jsx global>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.5);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(147, 51, 234, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(147, 51, 234, 0);
          }
        }
      `}</style>
    </>
  );
}
