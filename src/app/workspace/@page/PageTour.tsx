"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ArrowRight, WalletCards, MousePointerClick } from "lucide-react";
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
const TOUR_FEATURE_KEY = "page_card_creation_tour";

export function PageTour({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState<TourStep>(
    TourStep.HIGHLIGHT_TEXT,
  );
  const [isVisible, setIsVisible] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
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

      {/* Step 1: Highlight Text */}
      {currentStep === TourStep.HIGHLIGHT_TEXT && (
        <div className="pointer-events-none fixed inset-0 z-[9999]">
          <div
            className="pointer-events-auto absolute left-1/2 top-1/3 w-80 -translate-x-1/2 rounded-lg border border-border bg-card p-4 shadow-lg"
            style={{
              animation: "pulse 2s infinite",
            }}
          >
            <div className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-l border-t border-border bg-card"></div>
            <div className="mb-2 flex items-start justify-between">
              <h4 className="text-lg font-medium">Create Cards from Text</h4>
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
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <MousePointerClick className="h-4 w-4 text-primary" />
              <p>
                Select any text in your document, then click the card icon to
                create a flashcard.
              </p>
            </div>
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

      {/* Step 2: Open Sidebar */}
      {currentStep === TourStep.OPEN_SIDEBAR && (
        <div className="pointer-events-none fixed inset-0 z-[9999]">
          <div className="pointer-events-auto absolute right-16 top-20 w-80 rounded-lg border border-border bg-card p-4 shadow-lg">
            <div className="absolute -right-2 top-6 h-4 w-4 rotate-45 border-b border-r border-border bg-card"></div>
            <div className="mb-2 flex items-start justify-between">
              <h4 className="text-lg font-medium">View Your Cards</h4>
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
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <WalletCards className="h-4 w-4 text-primary" />
              <p>
                Click the sidebar button in the top right corner to view and
                manage your cards.
              </p>
            </div>
            <div className="mt-2 flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(TourStep.HIGHLIGHT_TEXT)}
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
