"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  ArrowRight,
  WalletCards,
  MousePointerClick,
  Info,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { markFeatureDiscovered } from "~/server/actions/featureDiscovery";
import { hasDiscoveredFeature } from "~/server/queries/featureDiscovery";
import { useUser } from "@clerk/nextjs";

// Define tour steps
enum TourStep {
  HIGHLIGHT_TEXT = 0,
  OPEN_SIDEBAR = 1,
  COMPLETED = 2,
}

// Define feature key for database storage
const TOUR_FEATURE_KEY = "page_card_creation_tour"; // Use the same key to maintain continuity

export function MobilePageTour({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState<TourStep>(
    TourStep.HIGHLIGHT_TEXT,
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

  // Listen for card creation events
  useEffect(() => {
    const handleCardCreated = () => {
      if (currentStep === TourStep.HIGHLIGHT_TEXT) {
        setCurrentStep(TourStep.OPEN_SIDEBAR);
        setIsMinimized(false); // Ensure tooltip is visible when advancing automatically
      }
    };

    window.addEventListener("card-created", handleCardCreated);
    return () => {
      window.removeEventListener("card-created", handleCardCreated);
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
          {/* Step 1: Highlight Text */}
          {currentStep === TourStep.HIGHLIGHT_TEXT && (
            <div className="pointer-events-auto fixed bottom-0 left-0 right-0 rounded-t-lg border-l border-r border-t border-border bg-card p-4 shadow-lg">
              <div className="mb-2 flex items-start justify-between">
                <h4 className="text-base font-medium">
                  Create Cards from Text
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
                <MousePointerClick className="h-4 w-4 flex-shrink-0 text-primary" />
                <p>
                  Select any text in your document, then tap the card icon to
                  create a flashcard.
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

          {/* Step 2: Open Sidebar */}
          {currentStep === TourStep.OPEN_SIDEBAR && (
            <div className="pointer-events-auto fixed bottom-0 left-0 right-0 rounded-t-lg border-l border-r border-t border-border bg-card p-4 shadow-lg">
              <div className="mb-2 flex items-start justify-between">
                <h4 className="text-base font-medium">View Your Cards</h4>
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
                <WalletCards className="h-4 w-4 flex-shrink-0 text-primary" />
                <p>
                  Tap the sidebar button in the top right corner to view and
                  manage your cards.
                </p>
              </div>
              <div className="mt-2 flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep(TourStep.HIGHLIGHT_TEXT)}
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
