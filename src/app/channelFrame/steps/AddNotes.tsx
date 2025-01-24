import { Button } from "~/components/ui/button";
import Image from "next/image";

interface AddNotesProps {
  goToNextStep: () => void;
}

export default function AddNotes({ goToNextStep }: AddNotesProps) {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <Image
        src="/onboarding-content-transparent.png"
        alt="Content"
        width={300}
        height={200}
        className="mb-8"
      />

      <div className="mb-8 max-w-2xl text-center">
        <h2 className="mb-4 text-2xl font-bold">Add Notes to Your Tags</h2>
        <p className="mb-4 text-lg text-gray-600 dark:text-gray-300">
          This helps us surface relevant resources.
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
