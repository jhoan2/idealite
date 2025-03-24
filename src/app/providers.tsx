// app/providers.tsx
"use client";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useUser } from "@clerk/nextjs";

if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: "/ingest",
    ui_host: "https://app.posthog.com",
  });
}

const WagmiProvider = dynamic(() => import("~/app/WagmiProvider"), {
  ssr: false,
});

export function PHProvider({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <PostHogAuthWrapper>
        <WagmiProvider>{children}</WagmiProvider>
      </PostHogAuthWrapper>
    </PostHogProvider>
  );
}

function PostHogAuthWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  useEffect(() => {
    if (user) {
      posthog.identify(user.id, {
        email: user.emailAddresses[0]?.emailAddress || "",
      });
    } else if (!user) {
      posthog.reset();
    }
  }, [user]);

  return children;
}
