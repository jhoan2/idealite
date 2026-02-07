"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "~/storage/db";
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "~/lib/utils";

/**
 * Visual indicator for the background sync status.
 */
export function SyncStatus() {
  const statusMeta = useLiveQuery(() => db.syncMetadata.get("sync_status"), []);
  const status = (statusMeta?.value as string) || "idle";

  const getIcon = () => {
    switch (status) {
      case "syncing":
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case "synced":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Cloud className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getLabel = () => {
    switch (status) {
      case "syncing":
        return "Syncing...";
      case "synced":
        return "Synced";
      case "error":
        return "Sync Error";
      default:
        return "Local-first";
    }
  };

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
      {getIcon()}
      <span>{getLabel()}</span>
    </div>
  );
}
