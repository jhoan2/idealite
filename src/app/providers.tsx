// app/providers.tsx
"use client";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";
import { useNeynarContext } from "@neynar/react";

// if (typeof window !== "undefined") {
//     posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
//       api_host: "/ingest",
//       ui_host: "https://app.posthog.com",
//     });
//   }

export function PHProvider({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <PostHogAuthWrapper>{children}</PostHogAuthWrapper>
    </PostHogProvider>
  );
}

function PostHogAuthWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useNeynarContext();
  useEffect(() => {
    if (user) {
      posthog.identify(user.fid.toString(), {
        name: user.username,
      });
    } else if (!user) {
      posthog.reset();
    }
  }, [user]);

  return children;
}
