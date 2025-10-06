"use client";

import Link from "next/link";
import { trackConversion } from "~/hooks/useExperimentTracking";

interface WaitlistButtonProps {
  children: React.ReactNode;
  className?: string;
}

export function WaitlistButton({ children, className }: WaitlistButtonProps) {
  return (
    <Link
      href="/waitlist"
      onClick={() => trackConversion("waitlist_button_clicked")}
      className={className}
    >
      {children}
    </Link>
  );
}
