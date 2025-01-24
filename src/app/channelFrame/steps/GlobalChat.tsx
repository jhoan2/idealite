import Image from "next/image";
import { Button } from "~/components/ui/button";

interface GlobalChatProps {
  goToNextStep: () => void;
}

export default function GlobalChat({ goToNextStep }: GlobalChatProps) {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <Image
        src="/onboard-chat-transparent.png"
        alt="Global Chat"
        width={400}
        height={300}
      />

      <div className="mb-8 max-w-2xl text-center">
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Like an MMO, our global chat creates a vibrant world where learners
          gather to share knowledge, form study groups, and grow together.
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
