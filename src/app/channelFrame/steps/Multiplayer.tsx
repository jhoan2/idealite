import { Button } from "~/components/ui/button";
import Image from "next/image";

export default function Multiplayer({
  goToNextStep,
}: {
  goToNextStep: () => void;
}) {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <Image
        src="/onboarding-gaming-double.png"
        alt="Multiplayer Games"
        width={400}
        height={300}
        className="mb-8"
      />

      <div className="mb-8 max-w-2xl text-center">
        <p className="mb-4 text-lg text-gray-600 dark:text-gray-300">
          Your notes become your arsenal. Battle friends in topic-based
          challenges, unlock achievements, and level up your mastery.
        </p>
      </div>

      <Button
        onClick={goToNextStep}
        size="lg"
        className="w-full rounded-full bg-primary py-4 text-primary-foreground"
      >
        Continue
      </Button>
    </div>
  );
}
