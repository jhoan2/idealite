// src/components/AutoSaveIndicator.tsx
import React from "react";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface AutoSaveIndicatorProps {
  status: SaveStatus;
  hasPending: boolean;
}

export const AutoSaveIndicator = React.memo(function AutoSaveIndicator({
  status,
  hasPending,
}: AutoSaveIndicatorProps) {
  switch (status) {
    case "saving":
      return (
        <span className="flex items-center gap-1 text-xs text-blue-400">
          <div className="h-2 w-2 animate-spin rounded-full bg-blue-400" />
          Saving...
        </span>
      );
    case "saved":
      return (
        <span className="flex items-center gap-1 text-xs text-green-400">
          <div className="h-2 w-2 rounded-full bg-green-400" />
          Saved
        </span>
      );
    case "error":
      return (
        <span className="flex items-center gap-1 text-xs text-red-400">
          <div className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
          Save failed
        </span>
      );
    default:
      return hasPending ? (
        <span className="flex items-center gap-1 text-xs text-yellow-400">
          <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
          Unsaved changes
        </span>
      ) : (
        <span className="text-xs text-gray-400">Auto-save ready</span>
      );
  }
});
