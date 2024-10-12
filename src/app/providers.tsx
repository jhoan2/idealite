// app/providers.tsx
'use client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from "react";

// if (typeof window !== "undefined") {
//     posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
//       api_host: "/ingest",
//       ui_host: "https://app.posthog.com",
//     });
//   }

export function PHProvider({
    children,
}: {
    children: React.ReactNode
}) {
    return <PostHogProvider client={posthog}>
        <PostHogAuthWrapper>{children}</PostHogAuthWrapper>
    </PostHogProvider>
}

function PostHogAuthWrapper({ children }: { children: React.ReactNode }) {
    // useEffect(() => {
    //     if (walletInfo.address) {
    //         posthog.identify(userInfo.user.id, {
    //             email: userInfo.user.emailAddresses[0]?.emailAddress,
    //             name: userInfo.user.fullName,
    //         });
    //     } else if (!auth.isSignedIn) {
    //         posthog.reset();
    //     }
    // }, [auth, userInfo]);

    return children;
}