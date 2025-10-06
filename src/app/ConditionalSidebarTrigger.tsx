"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "~/components/ui/sidebar";

export default function ConditionalSidebarTrigger() {
  const pathname = usePathname();

  // Hide the sidebar trigger on mobile routes (for React Native WebView)
  if (
    pathname === "/" ||
    pathname.startsWith("/mobile") ||
    pathname === "/waitlist" ||
    pathname.startsWith("/landing")
  ) {
    return null;
  }

  return (
    <div className="p-3 md:hidden">
      <SidebarTrigger />
    </div>
  );
}
