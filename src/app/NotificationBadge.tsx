// app/NotificationBadge.tsx
"use client";

import React, { useEffect, useState, useTransition } from "react";
import { Bell } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { getNotificationCounts } from "~/server/queries/notification";

interface NotificationBadgeProps {
  className?: string;
}

export function NotificationBadge({ className }: NotificationBadgeProps) {
  const [counts, setCounts] = useState({
    unread: 0,
    read: 0,
    reversed: 0,
    expired: 0,
  });
  const [isPending, startTransition] = useTransition();
  const { isLoaded, isSignedIn } = useUser();

  const fetchCounts = () => {
    if (!isLoaded || !isSignedIn) return;

    startTransition(async () => {
      try {
        const result = await getNotificationCounts();
        setCounts(result);
      } catch (error) {
        console.error("Failed to fetch notification counts:", error);
        // Don't update state on error - keep previous counts
      }
    });
  };

  useEffect(() => {
    // Fetch immediately when auth is ready
    if (isLoaded && isSignedIn) {
      fetchCounts();

      // Set up polling every 300 seconds
      const interval = setInterval(fetchCounts, 300000);

      // Cleanup interval on unmount
      return () => clearInterval(interval);
    }
  }, [isLoaded, isSignedIn]);

  // Don't render badge if user isn't authenticated
  if (!isLoaded || !isSignedIn) {
    return <Bell className={className} />;
  }

  return (
    <div className="relative">
      <Bell className={className} />
      {counts.unread > 0 && (
        <div className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
          {counts.unread > 99 ? "99+" : counts.unread}
        </div>
      )}
    </div>
  );
}
