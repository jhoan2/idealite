"use client";

import sdk from "@farcaster/frame-sdk";
import Image from "next/image";

export default function Final({ onComplete }: { onComplete: () => void }) {
  const addFrame = async () => {
    try {
      const result = await sdk.actions.addFrame();
      if (result.notificationDetails) {
      }
    } catch (error) {
      console.error("Failed to add frame:", error);
    }
    onComplete();
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      <div className="flex-1 px-6 pt-20">
        <div className="relative mb-20 rounded-xl bg-card bg-muted p-4 shadow-lg">
          <div className="absolute translate-x-56 translate-y-20">
            <Image
              src="/icon48.png"
              alt="idealite logo"
              width={48}
              height={48}
              className="rotate-[-45deg]"
            />
          </div>
          <h2 className="mb-4 text-center text-lg font-semibold text-foreground">
            Idealite Would Like to Send You Notifications
          </h2>
          <div className="flex gap-4">
            <button className="flex-1 text-muted-foreground">
              Don't allow
            </button>
            <button className="flex-1 text-primary">Allow</button>
          </div>
        </div>

        <h1 className="mb-4 text-center text-3xl font-bold text-foreground">
          Reach your daily goal with reminders
        </h1>
        <p className="mb-8 text-center text-muted-foreground">
          Enable push notifications to keep you motivated and on track.
        </p>

        <div className="space-y-4">
          <button
            onClick={addFrame}
            className="w-full rounded-full bg-primary py-4 text-primary-foreground"
          >
            Allow notifications
          </button>
          <button onClick={onComplete} className="w-full py-4 text-foreground">
            No thanks
          </button>
        </div>
      </div>
    </div>
  );
}
