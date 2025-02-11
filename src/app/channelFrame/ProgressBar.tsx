import { ChevronLeft } from "lucide-react";
import { Button } from "~/components/ui/button";
export default function ProgressBar({
  goToPrevStep,
  progress,
  currentStepIndex,
}: {
  goToPrevStep: () => void;
  progress: number;
  currentStepIndex: number;
}) {
  return (
    <div>
      <div className="flex h-12 items-center">
        {/* User can't back until step 2 because if they can, it'll throw an error when signing in*/}
        <div className="px-4">
          {/* Back Button container */}
          {currentStepIndex > 1 && (
            <Button
              onClick={goToPrevStep}
              className="rounded-full bg-transparent p-1"
              aria-label="Go back to previous step"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </Button>
          )}
        </div>
        <div className="flex-1 px-4">
          {" "}
          {/* Progress bar container */}
          <div className="w-full">
            <div className="h-0.5 bg-gray-200">
              <div
                className="h-0.5 bg-green-500 transition-all duration-300 ease-in-out"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
