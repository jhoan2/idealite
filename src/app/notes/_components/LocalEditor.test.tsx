import { render, act } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { LocalEditor } from "./LocalEditor";
import { useEditor } from "@tiptap/react";

// Mock tiptap to prevent real DOM issues in JSDOM while testing React lifecycle
vi.mock("@tiptap/react", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    useEditor: vi.fn(),
    EditorContent: ({ editor }: any) => <div data-testid="editor-content" />,
  };
});

describe("LocalEditor Loop Reproduction", () => {
  it("should not trigger infinite re-renders when content changes externally", async () => {
    const mockSetContent = vi.fn();
    const mockGetHTML = vi.fn().mockReturnValue("<p>Old Content</p>");
    
    // Mock the editor instance
    const mockEditor = {
      commands: {
        setContent: mockSetContent,
      },
      getHTML: mockGetHTML,
      isFocused: false,
      on: vi.fn(),
      off: vi.fn(),
      destroy: vi.fn(),
    };

    (useEditor as any).mockReturnValue(mockEditor);

    const onUpdate = vi.fn();

    // 1. Initial render
    const { rerender } = render(
      <LocalEditor initialContent="<p>Old Content</p>" onUpdate={onUpdate} />
    );

    // 2. Simulate an external update (e.g. from Sync)
    // In the bug version, this triggers: render -> setContent -> trigger state change -> render -> ...
    mockGetHTML.mockReturnValue("<p>Old Content</p>"); // Still returns old content after setContent simulate
    
    // We expect this NOT to throw "Maximum update depth exceeded"
    // If it was in a useEffect, it would be safe.
    expect(() => {
      rerender(
        <LocalEditor initialContent="<p>New Content</p>" onUpdate={onUpdate} />
      );
    }).not.toThrow();
  });
});
