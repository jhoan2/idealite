import { Button } from "~/components/ui/button";
import Image from "next/image";

export default function Topics({ goToNextStep }: { goToNextStep: () => void }) {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <Image
        src="/skill-tree-with-brand-colors.png"
        alt="Skill Tree"
        width={400}
        height={300}
        className="mb-8"
      />
      <div className="mb-8 max-w-2xl text-center">
        <h2 className="mb-4 text-2xl font-bold">
          Build Your Knowledge Skill Tree
        </h2>
        <p className="mb-4 text-lg text-gray-600 dark:text-gray-300">
          Every tag is a branch in your personal skill tree. As you engage with
          topics, you'll level up in different knowledge domains.
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
