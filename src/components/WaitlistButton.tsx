"use client";

import Link from "next/link";
import { trackConversion } from "~/hooks/useExperimentTracking";

interface WaitlistButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: string;
}

export function WaitlistButton({ children, className, variant }: WaitlistButtonProps) {
  const handleClick = () => {
    trackConversion("waitlist_button_clicked", {
      landing_variant: variant,
    });
  };

  return (
    <Link
      href="/waitlist"
      onClick={handleClick}
      className={className}
    >
      {children}
    </Link>
  );
}
