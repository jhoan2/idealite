"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ArrowRight, Info } from "lucide-react";
import { Button } from "~/components/ui/button";
import { markFeatureDiscovered } from "~/server/actions/featureDiscovery";
import { hasDiscoveredFeature } from "~/server/queries/featureDiscovery";
import { useUser } from "@clerk/nextjs";

// Define tour steps
enum TourStep {
  SELECT_TAG = 0,
  CREATE_PAGE = 1,
  NAVIGATE_TO_PAGE = 2,
  COMPLETED = 3,
}

// Define feature key for database storage
const TOUR_FEATURE_KEY = "mobile_global_tags_tour";

export function MobileGlobalTagsTour({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentStep, setCurrentStep] = useState<TourStep>(TourStep.SELECT_TAG);
  const [isVisible, setIsVisible] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { user } = useUser();
  const userId = user?.externalId;

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

      if (currentStep === TourStep.SELECT_TAG) {
        setCurrentStep(TourStep.CREATE_PAGE);
        setIsMinimized(false);
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

      if (currentStep === TourStep.CREATE_PAGE) {
        setCurrentStep(TourStep.NAVIGATE_TO_PAGE);
        setIsMinimized(false);
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

  // Skip the current step
  const skipStep = () => {
    if (currentStep < TourStep.COMPLETED) {
      setCurrentStep((prev) => prev + 1);
      setIsMinimized(false);
    }
  };

  // Skip the entire tour
  const skipTour = () => {
    completeTour().catch(console.error);
  };

  // Toggle minimized state
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
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

      {/* Minimized Indicator - shows when tour is minimized */}
      {isMinimized && (
        <div
          className="fixed bottom-4 right-4 z-[9999] flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary shadow-lg"
          onClick={toggleMinimize}
        >
          <Info className="h-5 w-5 text-primary-foreground" />
        </div>
      )}

      {/* Tour Steps */}
      {!isMinimized && (
        <div className="pointer-events-none fixed inset-0 z-[9999]">
          {/* Step 1: Click on a circle */}
          {currentStep === TourStep.SELECT_TAG && (
            <div className="pointer-events-auto fixed bottom-0 left-0 right-0 rounded-t-lg border-l border-r border-t border-border bg-card p-4 shadow-lg">
              <div className="mb-2 flex items-start justify-between">
                <h4 className="text-base font-medium">Step 1: Add a Tag</h4>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={toggleMinimize}
                    aria-label="Minimize tour"
                  >
                    <span className="text-lg">_</span>
                  </Button>
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
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                Tap on any circle in the visualization to add that tag to your
                workspace.
              </p>
              <div className="mt-2 flex justify-between">
                <Button variant="outline" size="sm" onClick={skipTour}>
                  Skip
                </Button>
                <Button size="sm" onClick={skipStep} className="gap-1">
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Right-click on tag */}
          {currentStep === TourStep.CREATE_PAGE && (
            <div className="pointer-events-auto fixed bottom-0 left-0 right-0 rounded-t-lg border-l border-r border-t border-border bg-card p-4 shadow-lg">
              <div className="mb-2 flex items-start justify-between">
                <h4 className="text-base font-medium">Step 2: Create a Page</h4>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={toggleMinimize}
                    aria-label="Minimize tour"
                  >
                    <span className="text-lg">_</span>
                  </Button>
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
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                Long-press on the tag you just added in the navigation panel,
                then select "Create page".
              </p>
              <div className="mt-2 flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep(TourStep.SELECT_TAG)}
                >
                  Back
                </Button>
                <Button size="sm" onClick={skipStep} className="gap-1">
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Click on page */}
          {currentStep === TourStep.NAVIGATE_TO_PAGE && (
            <div className="pointer-events-auto fixed bottom-0 left-0 right-0 rounded-t-lg border-l border-r border-t border-border bg-card p-4 shadow-lg">
              <div className="mb-2 flex items-start justify-between">
                <h4 className="text-base font-medium">
                  Step 3: Open Your Page
                </h4>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={toggleMinimize}
                    aria-label="Minimize tour"
                  >
                    <span className="text-lg">_</span>
                  </Button>
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
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                Tap on your newly created page to navigate to it and start
                taking notes.
              </p>
              <div className="mt-2 flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep(TourStep.CREATE_PAGE)}
                >
                  Back
                </Button>
                <Button size="sm" onClick={completeTour}>
                  Finish
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
