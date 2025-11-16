"use client";

import Link from "next/link";
import { usePostHog } from "posthog-js/react";

interface WaitlistButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: string;
}

export function WaitlistButton({
  children,
  className,
  variant,
}: WaitlistButtonProps) {
  const posthog = usePostHog();

  const handleClick = () => {
    if (typeof window !== "undefined" && posthog?.__loaded) {
      posthog.capture("waitlist_button_clicked", {
        // Use PostHog's feature flag property format for automatic experiment linking
        $feature_flag: "digital-method-of-loci",
        $feature_flag_response: variant,
        landing_variant: variant,
      });
    }
  };

  return (
    <Link href="/waitlist" onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
