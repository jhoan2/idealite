"use client";

import Image from "next/image";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { useSession } from "next-auth/react";

interface GlobalChatProps {
  goToNextStep: () => void;
}

export default function GlobalChat({ goToNextStep }: GlobalChatProps) {
  const { data: session } = useSession();

  const handleJoinChannel = async () => {
    const response = await fetch("/api/channelMembership", {
      method: "POST",
      body: JSON.stringify({ fid: session?.user?.fid }),
    });
    const data = await response.json();
    if (data.error) {
      toast.error(data.error);
    } else {
      toast.success("Invite sent!");
    }
    goToNextStep();
  };

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
      <div className="space-y-4">
        <Button
          onClick={handleJoinChannel}
          size="lg"
          className="w-full rounded-full bg-primary py-4 text-primary-foreground"
        >
          Join the channel
        </Button>
        <Button
          onClick={goToNextStep}
          size="lg"
          variant="outline"
          className="w-full rounded-full py-4"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
