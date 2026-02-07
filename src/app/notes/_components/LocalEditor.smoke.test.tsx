import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { LocalEditor } from "./LocalEditor";

// Mock the dependencies that might cause issues in a test environment
vi.mock("@tiptap/react", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    useEditor: vi.fn(() => ({
      getHTML: () => "<p></p>",
      getText: () => "",
      on: vi.fn(),
      off: vi.fn(),
      destroy: vi.fn(),
      isFocused: false,
      commands: {
        setContent: vi.fn(),
      },
    })),
    EditorContent: ({ editor }: any) => <div data-testid="tiptap-editor" />,
    BubbleMenu: ({ children }: any) => <div data-testid="bubble-menu">{children}</div>,
  };
});

describe("LocalEditor Compilation & Render Smoke Test", () => {
  it("should compile and render without syntax errors", () => {
    const onUpdate = vi.fn();
    
    // This will catch JSX syntax errors or missing braces during the test run
    const { getByTestId } = render(
      <LocalEditor 
        initialContent="<p>Hello World</p>" 
        onUpdate={onUpdate} 
        pageId="test-id"
      />
    );

    expect(getByTestId("tiptap-editor")).toBeDefined();
  });
});
