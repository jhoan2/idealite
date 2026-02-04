import { render, screen, fireEvent, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

import { MobileTagAccordion } from "./MobileTagAccordion";
import type { TagNode } from "./tagUtils";

// Mock node for testing
const mockNode: TagNode = {
  id: "test-id",
  name: "Test Tag",
  children: [],
  isInBoth: false,
  color: "#FAAC7D",
  parent_id: null,
  embedding: null,
  created_at: new Date(),
  updated_at: null,
  deleted: false,
  is_template: false,
};

const mockNodeWithChildren: TagNode = {
  ...mockNode,
  id: "parent-id",
  name: "Parent Tag",
  children: [
    {
      ...mockNode,
      id: "child-id",
      name: "Child Tag",
      parent_id: "parent-id",
    },
  ],
};

describe("MobileTagAccordion", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("quick tap does not trigger onAddTag", async () => {
    const onAddTag = vi.fn();
    render(
      <MobileTagAccordion
        node={mockNode}
        level={0}
        parentColor="#FAAC7D"
        onAddTag={onAddTag}
      />,
    );

    const element = screen.getByText("Test Tag");

    // Quick tap: touchStart then touchEnd within 500ms
    fireEvent.touchStart(element);
    act(() => {
      vi.advanceTimersByTime(100); // Only 100ms
    });
    fireEvent.touchEnd(element);

    // Advance past 500ms to ensure timeout would have fired
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onAddTag).not.toHaveBeenCalled();
  });

  it("long-press triggers onAddTag after 500ms", async () => {
    const onAddTag = vi.fn().mockResolvedValue(undefined);
    render(
      <MobileTagAccordion
        node={mockNode}
        level={0}
        parentColor="#FAAC7D"
        onAddTag={onAddTag}
      />,
    );

    const element = screen.getByText("Test Tag");

    fireEvent.touchStart(element);
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(onAddTag).toHaveBeenCalledWith("test-id", "Test Tag");
  });

  it("touch move cancels long-press", async () => {
    const onAddTag = vi.fn();
    render(
      <MobileTagAccordion
        node={mockNode}
        level={0}
        parentColor="#FAAC7D"
        onAddTag={onAddTag}
      />,
    );

    const element = screen.getByText("Test Tag");

    fireEvent.touchStart(element);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    fireEvent.touchMove(element);
    act(() => {
      vi.advanceTimersByTime(400); // Total 600ms
    });

    expect(onAddTag).not.toHaveBeenCalled();
  });

  it("touch cancel aborts long-press", async () => {
    const onAddTag = vi.fn();
    render(
      <MobileTagAccordion
        node={mockNode}
        level={0}
        parentColor="#FAAC7D"
        onAddTag={onAddTag}
      />,
    );

    const element = screen.getByText("Test Tag");

    fireEvent.touchStart(element);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    fireEvent.touchCancel(element);
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(onAddTag).not.toHaveBeenCalled();
  });

  it("does not call onAddTag when node is already in user tags (isInBoth)", async () => {
    const onAddTag = vi.fn();
    const nodeAlreadyAdded: TagNode = {
      ...mockNode,
      isInBoth: true,
    };

    render(
      <MobileTagAccordion
        node={nodeAlreadyAdded}
        level={0}
        parentColor="#FAAC7D"
        onAddTag={onAddTag}
      />,
    );

    const element = screen.getByText("Test Tag");

    fireEvent.touchStart(element);
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onAddTag).not.toHaveBeenCalled();
  });

  it("accordion expands and collapses on click for nodes with children", async () => {
    const onAddTag = vi.fn();
    render(
      <MobileTagAccordion
        node={mockNodeWithChildren}
        level={0}
        parentColor="#FAAC7D"
        onAddTag={onAddTag}
      />,
    );

    const parentElement = screen.getByText("Parent Tag");

    // Initially, child should not be visible (accordion collapsed)
    expect(screen.queryByText("Child Tag")).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(parentElement);

    // Child should now be visible
    expect(screen.getByText("Child Tag")).toBeInTheDocument();

    // Click again to collapse
    fireEvent.click(parentElement);

    // Child should be hidden again
    expect(screen.queryByText("Child Tag")).not.toBeInTheDocument();
  });
});
