"use client";

import { WizardProvider, useWizard } from "./_components/WizardContext";
import { WizardProgress } from "./_components/WizardProgress";
import { InputStep } from "./_components/steps/InputStep";
import { SceneSelectionStep } from "./_components/steps/SceneSelectionStep";

function WizardContent() {
  const { currentStep, error, setError } = useWizard();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Scene Creator</h1>
        <p className="mt-2 text-muted-foreground">
          Build Pixorize-style mnemonic scenes from your study notes
        </p>
      </div>

      <WizardProgress />

      {error && (
        <div className="mx-auto mb-6 max-w-3xl">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            <div className="flex items-start gap-3">
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <p>{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-1 text-xs underline hover:no-underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8">
        {currentStep === 1 && <InputStep />}
        {currentStep === 2 && <SceneSelectionStep />}
      </div>
    </div>
  );
}

export default function MnemonicPage() {
  return (
    <WizardProvider>
      <WizardContent />
    </WizardProvider>
  );
}
