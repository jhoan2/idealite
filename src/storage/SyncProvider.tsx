"use client";

import { useEffect } from "react";
import { SyncManager } from "./sync";

/**
 * Provider to orchestrate background synchronization.
 * Triggers a sync on mount and then on a regular interval.
 */
export function SyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 1. Initial Sync on mount (Bootstrap)
    SyncManager.sync();

    // 2. Setup background heart-beat (every 30 seconds)
    const interval = setInterval(() => {
      SyncManager.sync();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
}
