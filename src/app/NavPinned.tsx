// src/app/NavPinned.tsx (Updated)
"use client";

import React, { useState, useEffect } from "react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { Pin, FileText, Map, GripVertical } from "lucide-react";
import Link from "next/link";
import {
  getUserPinnedPages,
  type PinnedPage,
} from "~/server/queries/pinnedPages";
import { unpinPage, reorderPinnedPages } from "~/server/actions/pinnedPages";
import { usePathname, useSearchParams } from "next/navigation";

// dnd-kit imports
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Individual sortable item
function PinnedPageItem({
  page,
  isActive,
  onUnpin,
  isDragOverlay = false,
}: {
  page: PinnedPage;
  isActive: boolean;
  onUnpin: (pageId: string) => void;
  isDragOverlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: page.id,
    disabled: isDragOverlay, // Disable sortable behavior for overlay
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const content = (
    <SidebarMenuButton asChild isActive={isActive && !isDragOverlay}>
      <Link
        href={`/workspace?pageId=${page.id}`}
        className="flex items-center gap-2"
      >
        {page.content_type === "canvas" ? (
          <Map className="h-4 w-4" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        <span className="flex-1 truncate">{page.title}</span>
      </Link>
    </SidebarMenuButton>
  );

  if (isDragOverlay) {
    // For the drag overlay, render without sortable wrapper
    return (
      <div className="w-full rounded-md border border-sidebar-border bg-sidebar shadow-lg">
        <SidebarMenuItem className="group relative">
          {content}
          <div className="absolute right-1 top-1/2 -translate-y-1/2 p-1">
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>
        </SidebarMenuItem>
      </div>
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <SidebarMenuItem
          ref={setNodeRef}
          style={style}
          className="group relative"
        >
          {content}

          {/* Drag handle - only show on hover */}
          <div
            {...attributes}
            {...listeners}
            className="absolute right-1 top-1/2 -translate-y-1/2 cursor-grab p-1 opacity-0 transition-opacity active:cursor-grabbing group-hover:opacity-100"
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>
        </SidebarMenuItem>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem
          onClick={() => onUnpin(page.id)}
          className="text-destructive focus:text-destructive"
        >
          <Pin className="mr-2 h-4 w-4" />
          Unpin
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

interface NavPinnedProps {
  initialPinnedPages: PinnedPage[];
}

export function NavPinned({ initialPinnedPages }: NavPinnedProps) {
  const [pinnedPages, setPinnedPages] =
    useState<PinnedPage[]>(initialPinnedPages);
  const [activeId, setActiveId] = useState<string | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Configure drag sensor
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Start drag after 8px movement
      },
    }),
  );

  const fetchPinnedPages = async () => {
    try {
      const pages = await getUserPinnedPages();
      setPinnedPages(pages);
    } catch (error) {
      console.error("Failed to load pinned pages:", error);
    }
  };

  // Listen for pinned pages changes from other components
  useEffect(() => {
    const handlePinnedPagesChanged = () => {
      fetchPinnedPages();
    };

    window.addEventListener("pinnedPagesChanged", handlePinnedPagesChanged);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener(
        "pinnedPagesChanged",
        handlePinnedPagesChanged,
      );
    };
  }, []);

  // Handle unpinning
  const handleUnpin = async (pageId: string) => {
    try {
      const result = await unpinPage({ pageId });
      if (result.success) {
        setPinnedPages((prev) => prev.filter((page) => page.id !== pageId));

        // Dispatch the custom event to notify other components
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("pinnedPagesChanged"));
        }
      }
    } catch (error) {
      console.error("Error unpinning page:", error);
    }
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = pinnedPages.findIndex((page) => page.id === active.id);
    const newIndex = pinnedPages.findIndex((page) => page.id === over.id);

    // Optimistically update UI
    const newOrder = arrayMove(pinnedPages, oldIndex, newIndex);
    setPinnedPages(newOrder);

    // Update server
    try {
      const pageIds = newOrder.map((page) => page.id);
      const result = await reorderPinnedPages({ pageIds });

      if (!result.success) {
        // Revert on failure
        const originalPages = await getUserPinnedPages();
        setPinnedPages(originalPages);
      }
    } catch (error) {
      console.error("Error reordering pages:", error);
      // Revert on error
      const originalPages = await getUserPinnedPages();
      setPinnedPages(originalPages);
    }
  };

  // Get the currently dragged page for the overlay
  const activeItem = activeId
    ? pinnedPages.find((page) => page.id === activeId)
    : null;

  // Don't render if no pinned pages
  if (pinnedPages.length === 0) {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center gap-2">
        <Pin className="h-4 w-4" />
        Pinned
      </SidebarGroupLabel>

      <SidebarMenu>
        <DndContext
          id="pinned-pages-dnd"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={pinnedPages.map((page) => page.id)}
            strategy={verticalListSortingStrategy}
          >
            {pinnedPages.map((page) => {
              const currentPageId = searchParams.get("pageId");
              const isActive =
                pathname === "/workspace" && currentPageId === page.id;
              return (
                <PinnedPageItem
                  key={page.id}
                  page={page}
                  isActive={isActive}
                  onUnpin={handleUnpin}
                />
              );
            })}
          </SortableContext>

          <DragOverlay>
            {activeItem ? (
              <PinnedPageItem
                page={activeItem}
                isActive={false}
                onUnpin={() => {}}
                isDragOverlay={true}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </SidebarMenu>
    </SidebarGroup>
  );
}
