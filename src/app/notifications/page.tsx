// src/app/notifications/page.tsx
"use client";

import { Button } from "~/components/ui/button";
import { useInfiniteNotifications } from "~/hooks/useInfiniteScroll";
import {
  Bell,
  Plus,
  Minus,
  Info,
  Pencil,
  Lightbulb,
  RefreshCw,
  Loader2,
  Undo
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { undoPageArchive } from "~/server/actions/autoArchive";
import { toast } from "sonner";
import * as Sentry from "@sentry/nextjs";


// Simple relative time function (no external dependencies)
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return "now";
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  if (diffInHours < 24) return `${diffInHours}h`;
  if (diffInDays < 7) return `${diffInDays}d`;

  // For older notifications, show the actual date
  return date.toLocaleDateString();
}

// Map notification types to their corresponding icons
const getNotificationIcon = (type: string) => {
  switch (type) {
    case "creation":
      return Plus;
    case "deletion":
      return Minus;
    case "info":
      return Info;
    case "update":
      return Pencil;
    case "suggestion":
      return Lightbulb;
    default:
      return Info; // fallback icon
  }
};

// Error component
function ErrorBanner({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="mx-4 my-4 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="mr-1 h-3 w-3" />
          Retry
        </Button>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { notifications, isLoading, hasMore, error, refresh, sentinelRef, queueForMarkingRead } =
    useInfiniteNotifications();
const [undoingNotifications, setUndoingNotifications] = useState<Set<string>>(new Set());

const handleUndo = async (notificationId: string, eventType: string) => {
  // Prevent multiple clicks
  if (undoingNotifications.has(notificationId)) {
    return;
  }
  
  // Add notification to loading set
  setUndoingNotifications(prev => new Set([...prev, notificationId]));
  
  try {
    if (eventType === "auto_archive") {
      const result = await undoPageArchive(notificationId);
      
      if (result.success) {
        toast.success("Page archive action has been undone");
      } else {
        throw new Error("Failed to undo archive action");
      }
    } else if (eventType === "creation") {
      // Placeholder for future undo creation logic
      toast.error("Undo for creation actions not yet implemented");
    } else if (eventType === "deletion") {
      // Placeholder for future undo deletion logic  
      toast.error("Undo for deletion actions not yet implemented");
    } else if (eventType === "update") {
      // Placeholder for future undo update logic
      toast.error("Undo for update actions not yet implemented");
    } else {
      toast.error(`Undo action for ${eventType} is not supported`);
    }
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        action: "undo_notification",
        event_type: eventType,
        notification_id: notificationId,
      },
      contexts: {
        notification: {
          id: notificationId,
          event_type: eventType,
        }
      }
    });
    
    // Extract error message
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Failed to undo action. Please try again.";
    
    toast.error(errorMessage);
  } finally {
    // Remove notification from loading set
    setUndoingNotifications(prev => {
      const newSet = new Set(prev);
      newSet.delete(notificationId);
      return newSet;
    });
  }
};

  // Create refs for each notification
  const notificationRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Set up intersection observers for unread notifications
  useEffect(() => {
    const observers = new Map<string, IntersectionObserver>();
    
    notifications.forEach((notification) => {
      if (notification.status === "unread") {
        const element = notificationRefs.current.get(notification.id);
        if (element) {
          const observer = new IntersectionObserver(
            ([entry]) => {
              if (entry?.isIntersecting) {
                queueForMarkingRead(notification.id);
              }
            },
            { 
              threshold: 0.5,
              rootMargin: "0px 0px -50px 0px"
            }
          );
          
          observer.observe(element);
          observers.set(notification.id, observer);
        }
      }
    });

    // Cleanup function
    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [notifications, queueForMarkingRead]);

  // Function to set notification ref
  const setNotificationRef = (id: string) => (element: HTMLDivElement | null) => {
    if (element) {
      notificationRefs.current.set(id, element);
    } else {
      notificationRefs.current.delete(id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 border-b bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Notifications</h1>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && <ErrorBanner error={error} onRetry={refresh} />}

      {/* Empty state */}
      {notifications.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center px-4 py-12">
          <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-medium">No notifications yet</h3>
          <p className="max-w-sm text-center text-sm text-muted-foreground">
            You'll see notifications here when there are updates to your pages,
            cards, or system messages.
          </p>
        </div>
      )}

      {/* Notifications List */}
      {notifications.length > 0 && (
        <div className="divide-y divide-border">
          {notifications.map((notification) => {
            const IconComponent = getNotificationIcon(
              notification.notification_type,
            );
            const isUnread = notification.status === "unread";

            return (
              <div
                key={notification.id}
                ref={setNotificationRef(notification.id)}
                className={`flex items-start gap-3 px-4 py-4 transition-colors active:bg-muted/50 ${
                  isUnread ? "bg-muted/30" : "hover:bg-muted/30"
                }`}
              >
                <div
                  className={`rounded-full p-2 ${isUnread ? "bg-primary/10" : "bg-muted"}`}
                >
                  <IconComponent
                    className={`h-4 w-4 ${isUnread ? "text-primary" : "text-muted-foreground"}`}
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`truncate text-sm font-medium leading-none ${
                        isUnread ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {notification.title}
                    </p>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <p className="whitespace-nowrap text-xs text-muted-foreground">
                        {getRelativeTime(new Date(notification.created_at))}
                      </p>
                      {/* Only show undo button for actionable notifications */}
{(["creation", "deletion", "update"].includes(notification.notification_type) || 
  (notification.event_type === "auto_archive")) && 
  notification.status !== "reversed" && (
  <Button 
    variant="ghost" 
    size="sm" 
    className={`h-6 w-6 p-1 ${undoingNotifications.has(notification.id) ? "cursor-not-allowed opacity-50" : ""}`}
    title="Undo Action"
    disabled={undoingNotifications.has(notification.id)}
    onClick={() => handleUndo(notification.id, notification.event_type)}
  >
    {undoingNotifications.has(notification.id) ? (
      <Loader2 className="h-3 w-3 animate-spin" />
    ) : (
      <Undo className="h-3 w-3" />
    )}
  </Button>
)}
                    </div>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Loading indicator for infinite scroll */}
          {isLoading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Sentinel element for infinite scroll */}
          <div ref={sentinelRef} className="h-1" />

          {/* End indicator */}
          {!hasMore && notifications.length > 0 && (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">
                You've reached the end of your notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}