// app/providers.tsx
"use client";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useUser } from "@clerk/nextjs";
import { TooltipProvider } from "~/components/ui/tooltip";

if (typeof window !== "undefined") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: "/idealite-ph",
    ui_host: "https://app.posthog.com",
  });
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <PostHogAuthWrapper>
        <TooltipProvider>{children}</TooltipProvider>
      </PostHogAuthWrapper>
    </PostHogProvider>
  );
}

function PostHogAuthWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  useEffect(() => {
    // Wait for PostHog to fully load before calling any methods
    if (!posthog.__loaded) {
      return;
    }

    if (user) {
      posthog.identify(user.id, {
        email: user.emailAddresses[0]?.emailAddress || "",
      });
    }
  }, [user]);

  return children;
}
