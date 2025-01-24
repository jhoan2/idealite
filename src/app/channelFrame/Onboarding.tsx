"use client";

import { SelectTag } from "~/server/queries/tag";
import { useRouter, useSearchParams } from "next/navigation";
import Welcome from "./steps/Welcome";
import ProgressBar from "./ProgressBar";
import TagSelection from "./steps/TagSelection";
import GlobalChat from "./steps/GlobalChat";
import Topics from "./steps/Topics";
import AddNotes from "./steps/AddNotes";
import Multiplayer from "./steps/Multiplayer";
import Final from "./steps/Final";

interface OnboardingProps {
  tag: SelectTag[];
  userTags: SelectTag[];
  userId: string | null;
  onComplete: () => void;
}

type OnboardingStep =
  | "welcome"
  | "globalChat"
  | "topics"
  | "tags"
  | "addNotes"
  | "multiplayer"
  | "final";
const STEP_ORDER: OnboardingStep[] = [
  "welcome",
  "globalChat",
  "topics",
  "tags",
  "addNotes",
  "multiplayer",
  "final",
];

export default function Onboarding({
  tag,
  userTags,
  userId,
  onComplete,
}: OnboardingProps) {
  const searchParams = useSearchParams();
  const currentStep = (searchParams.get("step") as OnboardingStep) || "welcome";
  const router = useRouter();

  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const progress = (currentStepIndex / (STEP_ORDER.length - 1)) * 100;
  const isFirstStep = currentStepIndex === 0;

  const goToNextStep = () => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      const nextStep = STEP_ORDER[currentIndex + 1];
      router.push(`/channelFrame?step=${nextStep}`);
    }
  };

  const goToPrevStep = () => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      const prevStep = STEP_ORDER[currentIndex - 1];
      router.push(`/channelFrame?step=${prevStep}`);
    }
  };

  return (
    <div className="min-h-screen">
      {!isFirstStep && (
        <ProgressBar
          goToPrevStep={goToPrevStep}
          progress={progress}
          currentStepIndex={currentStepIndex}
        />
      )}
      <div>
        {/* Step content */}
        {currentStep === "welcome" && <Welcome goToNextStep={goToNextStep} />}
        {currentStep === "globalChat" && (
          <GlobalChat goToNextStep={goToNextStep} />
        )}
        {currentStep === "topics" && <Topics goToNextStep={goToNextStep} />}
        {currentStep === "tags" && (
          <TagSelection
            goToNextStep={goToNextStep}
            tag={tag}
            userTags={userTags}
            userId={userId}
            onComplete={onComplete}
          />
        )}
        {currentStep === "addNotes" && <AddNotes goToNextStep={goToNextStep} />}
        {currentStep === "multiplayer" && (
          <Multiplayer goToNextStep={goToNextStep} />
        )}
        {currentStep === "final" && <Final onComplete={onComplete} />}
      </div>
    </div>
  );
}
