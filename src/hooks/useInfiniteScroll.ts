// src/hooks/useInfiniteScroll.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getUserNotificationsPaginated,
  markMultipleNotificationsAsRead,
  type PaginatedNotifications,
} from "~/server/queries/notification";

export function useInfiniteNotifications(
  status?: "unread" | "read" | "reversed" | "expired",
) {
  const [notifications, setNotifications] = useState<
    PaginatedNotifications["data"]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // State for batching notifications to mark as read
  const [notificationsToMarkRead, setNotificationsToMarkRead] = useState<Set<string>>(new Set());

  // Ref for the sentinel element
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Batch update function
  const batchMarkAsRead = useCallback(async (notificationIds: string[]) => {
    if (notificationIds.length === 0) return;
    
    try {
      await markMultipleNotificationsAsRead(notificationIds);
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id) 
            ? { ...notification, status: "read" }
            : notification
        )
      );
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  }, []);

  // Timer effect to batch process notifications
  useEffect(() => {
    const timer = setInterval(() => {
      if (notificationsToMarkRead.size > 0) {
        const idsToProcess = Array.from(notificationsToMarkRead);
        batchMarkAsRead(idsToProcess);
        setNotificationsToMarkRead(new Set());
      }
    }, 2000); // Batch every 2 seconds

    return () => clearInterval(timer);
  }, [notificationsToMarkRead, batchMarkAsRead]);

  // Function to add notification to the batch queue
  const queueForMarkingRead = useCallback((notificationId: string) => {
    setNotificationsToMarkRead(prev => new Set([...prev, notificationId]));
  }, []);

  // Load initial notifications
  const loadInitialNotifications = useCallback(async () => {
    try {
      setError(null);

      // Call server action directly
      const result = await getUserNotificationsPaginated(10);

      setNotifications(result.data);
      setHasMore(result.pagination.hasMore);
      setNextCursor(result.pagination.nextCursor);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load notifications",
      );
    }
  }, []);

  // Load more notifications
  const loadMoreNotifications = useCallback(async () => {
    if (isLoading || !hasMore || !nextCursor) return;

    try {
      setIsLoading(true);
      setError(null);

      // Call server action directly
      const result = await getUserNotificationsPaginated(10, nextCursor);

      // Append new notifications to existing ones
      setNotifications((prev) => [...prev, ...result.data]);
      setHasMore(result.pagination.hasMore);
      setNextCursor(result.pagination.nextCursor);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load more notifications",
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, nextCursor]);

  // Intersection Observer setup for infinite scroll
  useEffect(() => {
    const sentinelElement = sentinelRef.current;
    if (!sentinelElement || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && !isLoading) {
          loadMoreNotifications();
        }
      },
      {
        // Trigger when sentinel is 100px from entering viewport
        rootMargin: "100px",
        threshold: 0,
      },
    );

    observer.observe(sentinelElement);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, loadMoreNotifications]);

  // Load initial data on mount
  useEffect(() => {
    loadInitialNotifications();
  }, [loadInitialNotifications]);

  // Refresh function to reload from the beginning
  const refresh = useCallback(() => {
    setNotifications([]);
    setNextCursor(null);
    setHasMore(true);
    // Clear pending mark-as-read queue
    setNotificationsToMarkRead(new Set());
    loadInitialNotifications();
  }, [loadInitialNotifications]);

  // Add new notification to the top (for real-time updates)
  const prependNotification = useCallback(
    (notification: PaginatedNotifications["data"][0]) => {
      setNotifications((prev) => [notification, ...prev]);
    },
    [],
  );

  return {
    // Data
    notifications,

    // Loading states
    isLoading,
    hasMore,
    error,

    // Actions
    refresh,
    prependNotification,
    queueForMarkingRead, // NEW: Export this function

    // Refs
    sentinelRef,
  };
}