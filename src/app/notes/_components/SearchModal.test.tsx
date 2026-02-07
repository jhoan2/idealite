import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeAll } from "vitest";
import { SearchModal } from "./SearchModal";
import * as useLocalSearchHook from "../_hooks/useLocalSearch";

// Mock ResizeObserver for cmdk
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// Mock the hook and router
vi.mock("../_hooks/useLocalSearch", () => ({
  useLocalSearch: vi.fn(),
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("SearchModal", () => {
  it("renders input and results", () => {
    // Mock return value for the hook
    (useLocalSearchHook.useLocalSearch as any).mockReturnValue([
      { id: "1", title: "Test Note" },
    ]);

    render(<SearchModal open={true} onOpenChange={vi.fn()} />);

    // Check if input is focused/present
    expect(screen.getByPlaceholderText("Search notes by title...")).toBeDefined();

    // Check if results are rendered
    expect(screen.getByText("Test Note")).toBeDefined();
  });

  it("navigates on selection", () => {
    (useLocalSearchHook.useLocalSearch as any).mockReturnValue([
      { id: "1", title: "Test Note" },
    ]);

    const onOpenChange = vi.fn();
    render(<SearchModal open={true} onOpenChange={onOpenChange} />);

    // Click the result
    fireEvent.click(screen.getByText("Test Note"));

    // Verify navigation and close
    expect(mockPush).toHaveBeenCalledWith("/notes/1");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
