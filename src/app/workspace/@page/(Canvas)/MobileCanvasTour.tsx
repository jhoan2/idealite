"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ArrowRight, Image, Save, Sidebar, Copy, Info } from "lucide-react";
import { Button } from "~/components/ui/button";
import { markFeatureDiscovered } from "~/server/actions/featureDiscovery";
import { hasDiscoveredFeature } from "~/server/queries/featureDiscovery";
import { useUser } from "@clerk/nextjs";

// Define tour steps
enum TourStep {
  OPEN_SIDEBAR = 0,
  SWITCH_TO_IMAGE_GEN = 1,
  ADD_TO_CANVAS = 2,
  SAVE_CANVAS = 3,
  COMPLETED = 4,
}

// Define feature key for database storage
const TOUR_FEATURE_KEY = "canvas_image_tour";

export function MobileCanvasTour({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState<TourStep>(
    TourStep.OPEN_SIDEBAR,
  );
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

  // Listen for events
  useEffect(() => {
    const handleSidebarOpened = () => {
      if (currentStep === TourStep.OPEN_SIDEBAR) {
        setCurrentStep(TourStep.SWITCH_TO_IMAGE_GEN);
        setIsMinimized(false);
      }
    };

    const handleImageTabSelected = () => {
      if (currentStep === TourStep.SWITCH_TO_IMAGE_GEN) {
        setCurrentStep(TourStep.ADD_TO_CANVAS);
        setIsMinimized(false);
      }
    };

    const handleImageAdded = () => {
      if (currentStep === TourStep.ADD_TO_CANVAS) {
        setCurrentStep(TourStep.SAVE_CANVAS);
        setIsMinimized(false);
      }
    };

    window.addEventListener("sidebar-opened", handleSidebarOpened);
    window.addEventListener("image-tab-selected", handleImageTabSelected);
    window.addEventListener("canvas-image-added", handleImageAdded);

    return () => {
      window.removeEventListener("sidebar-opened", handleSidebarOpened);
      window.removeEventListener("image-tab-selected", handleImageTabSelected);
      window.removeEventListener("canvas-image-added", handleImageAdded);
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
          {/* Step 1: Open Sidebar */}
          {currentStep === TourStep.OPEN_SIDEBAR && (
            <div className="pointer-events-auto fixed bottom-0 left-0 right-0 rounded-t-lg border-l border-r border-t border-border bg-card p-4 shadow-lg">
              <div className="mb-2 flex items-start justify-between">
                <h4 className="text-base font-medium">Open Sidebar</h4>
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
              <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                <p>
                  Tap the <Sidebar className="inline h-4 w-4" /> button in the
                  top right corner to open the right sidebar.
                </p>
              </div>
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

          {/* Step 2: Switch to Image Generation Tab */}
          {currentStep === TourStep.SWITCH_TO_IMAGE_GEN && (
            <div className="pointer-events-auto fixed bottom-0 left-0 right-0 rounded-t-lg border-l border-r border-t border-border bg-card p-4 shadow-lg">
              <div className="mb-2 flex items-start justify-between">
                <h4 className="text-base font-medium">
                  Switch to Image Generator
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
              <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                <p>
                  Tap the <Image className="inline h-4 w-4" /> button in the top
                  right of the sidebar to switch to the image generation tab.
                </p>
              </div>
              <div className="mt-2 flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep(TourStep.OPEN_SIDEBAR)}
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

          {/* Step 3: Add to Canvas */}
          {currentStep === TourStep.ADD_TO_CANVAS && (
            <div className="pointer-events-auto fixed bottom-0 left-0 right-0 rounded-t-lg border-l border-r border-t border-border bg-card p-4 shadow-lg">
              <div className="mb-2 flex items-start justify-between">
                <h4 className="text-base font-medium">Add Image to Canvas</h4>
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
              <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                <p>
                  Generate an image from the sidebar, then tap the{" "}
                  <Copy className="inline h-4 w-4" /> button and paste it onto
                  your canvas.
                </p>
              </div>
              <div className="mt-2 flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep(TourStep.SWITCH_TO_IMAGE_GEN)}
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

          {/* Step 4: Save Canvas */}
          {currentStep === TourStep.SAVE_CANVAS && (
            <div className="pointer-events-auto fixed bottom-0 left-0 right-0 rounded-t-lg border-l border-r border-t border-border bg-card p-4 shadow-lg">
              <div className="mb-2 flex items-start justify-between">
                <h4 className="text-base font-medium">Save Your Canvas</h4>
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
              <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                <p>
                  Tap the save button <Save className="inline h-4 w-4" /> at the
                  bottom of the toolbar to create cards from your design.
                </p>
              </div>
              <div className="mt-2 flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep(TourStep.ADD_TO_CANVAS)}
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
