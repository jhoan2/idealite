"use client";
import React, { useState, useRef, useCallback } from "react";
import { Pin, PinOff } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer";
import { toggleTagPinned } from "~/server/actions/usersTags";

interface TagInteractionWrapperProps {
  children: React.ReactNode;
  tagId: string;
  tagName: string;
  isPinned: boolean;
  isMobile: boolean;
  onTagClick?: () => void;
}

// Custom hook for long press detection
function useLongPress(
  onLongPress: () => void,
  onClick?: () => void,
  delay = 500,
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const startPressTimer = useCallback(() => {
    isLongPressRef.current = false;
    timeoutRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  const handleMouseDown = useCallback(() => {
    startPressTimer();
  }, [startPressTimer]);

  const handleMouseUp = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (!isLongPressRef.current && onClick) {
      onClick();
    }
  }, [onClick]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const handleTouchStart = useCallback(() => {
    startPressTimer();
  }, [startPressTimer]);

  const handleTouchEnd = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (!isLongPressRef.current && onClick) {
      onClick();
    }
  }, [onClick]);

  return {
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseLeave,
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
}

export function TagInteractionWrapper({
  children,
  tagId,
  tagName,
  isPinned,
  isMobile,
  onTagClick,
}: TagInteractionWrapperProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleTogglePin = async () => {
    setIsLoading(true);
    try {
      const result = await toggleTagPinned({
        tagId,
        isPinned: !isPinned,
      });

      if (result.success) {
        setIsDrawerOpen(false);
      }
    } catch (error) {
      console.error("Error toggling pin:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const longPressHandlers = useLongPress(
    () => {
      if (isMobile) {
        setIsDrawerOpen(true);
      }
    },
    onTagClick,
    500,
  );

  if (isMobile) {
    return (
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerTrigger asChild>
          <div {...longPressHandlers} className="w-full">
            {children}
          </div>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{tagName}</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 pb-8">
            <button
              onClick={handleTogglePin}
              disabled={isLoading}
              className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
            >
              {isPinned ? (
                <>
                  <PinOff className="h-5 w-5" />
                  <span>Unpin from Quick Access</span>
                </>
              ) : (
                <>
                  <Pin className="h-5 w-5" />
                  <span>Pin to Quick Access</span>
                </>
              )}
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use context menu
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div onClick={onTagClick} className="w-full cursor-pointer">
          {children}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={handleTogglePin} disabled={isLoading}>
          {isPinned ? (
            <>
              <PinOff className="mr-2 h-4 w-4" />
              Unpin from Quick Access
            </>
          ) : (
            <>
              <Pin className="mr-2 h-4 w-4" />
              Pin to Quick Access
            </>
          )}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
