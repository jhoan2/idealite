import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useEditor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import { LocalEditor } from "./LocalEditor";

const createCardFromPageMock = vi.fn();
const toastErrorMock = vi.fn();
const toastSuccessMock = vi.fn();

vi.mock("~/server/actions/card", () => ({
  createCardFromPage: (...args: any[]) => createCardFromPageMock(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: any[]) => toastErrorMock(...args),
    success: (...args: any[]) => toastSuccessMock(...args),
  },
}));

vi.mock("@tiptap/pm/state", () => {
  class MockNodeSelection {
    node: any;
    from: number;
    to: number;

    constructor(node: any, from = 1, to = 1) {
      this.node = node;
      this.from = from;
      this.to = to;
    }
  }

  return { NodeSelection: MockNodeSelection };
});

vi.mock("@tiptap/react", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    useEditor: vi.fn(),
    EditorContent: ({ editor }: any) => <div data-testid="editor-content" />,
    BubbleMenu: ({ children }: any) => <div data-testid="bubble-menu">{children}</div>,
  };
});

function makeEditor({
  selectedText = "Selected note text",
  nodeId = "node-1",
  selection,
}: {
  selectedText?: string;
  nodeId?: string;
  selection?: any;
} = {}) {
  const defaultSelection = selection ?? { from: 1, to: 8 };
  const run = vi.fn();
  const chainFocus = {
    toggleBold: () => ({ run }),
    toggleItalic: () => ({ run }),
    setImage: () => ({ run }),
  };

  return {
    state: {
      selection: defaultSelection,
      doc: {
        textBetween: vi.fn().mockReturnValue(selectedText),
        resolve: vi.fn().mockReturnValue({
          depth: 0,
          node: () => ({ attrs: { nodeId } }),
        }),
      },
    },
    commands: {
      setContent: vi.fn(),
      setTextSelection: vi.fn(),
      focus: vi.fn(),
    },
    chain: vi.fn(() => ({
      focus: () => chainFocus,
    })),
    getHTML: vi.fn().mockReturnValue("<p>Old Content</p>"),
    getText: vi.fn().mockReturnValue("Old Content"),
    isFocused: false,
    on: vi.fn(),
    off: vi.fn(),
    destroy: vi.fn(),
  };
}

describe("LocalEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createCardFromPageMock.mockResolvedValue({ success: true });
  });

  it("should not trigger infinite re-renders when content changes externally", () => {
    const mockEditor = makeEditor();
    (useEditor as any).mockReturnValue(mockEditor);
    const onUpdate = vi.fn();

    const { rerender } = render(
      <LocalEditor
        initialContent="<p>Old Content</p>"
        onUpdate={onUpdate}
        pageId="9f1fab8d-e1d0-495f-9f08-5202de8d1f91"
      />,
    );

    mockEditor.getHTML.mockReturnValue("<p>Old Content</p>");

    expect(() => {
      rerender(
        <LocalEditor
          initialContent="<p>New Content</p>"
          onUpdate={onUpdate}
          pageId="9f1fab8d-e1d0-495f-9f08-5202de8d1f91"
        />,
      );
    }).not.toThrow();
  });

  it("creates QA cards using cardPayload and no legacy question/answer columns", async () => {
    (useEditor as any).mockReturnValue(makeEditor());

    render(
      <LocalEditor
        initialContent="<p>hello</p>"
        onUpdate={vi.fn()}
        pageId="9f1fab8d-e1d0-495f-9f08-5202de8d1f91"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /create card/i }));
    fireEvent.change(screen.getByPlaceholderText("Enter the question"), {
      target: { value: "What is ATP?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Flashcard" }));

    await waitFor(() => {
      expect(createCardFromPageMock).toHaveBeenCalledTimes(1);
    });

    const request = createCardFromPageMock.mock.calls[0][0];
    expect(request.cardType).toBe("qa");
    expect(request.cardPayload).toEqual({
      prompt: "What is ATP?",
      response: "Selected note text",
    });
    expect(request).not.toHaveProperty("question");
    expect(request).not.toHaveProperty("answer");
    expect(request).not.toHaveProperty("clozeTemplate");
    expect(request).not.toHaveProperty("clozeAnswers");
  });

  it("creates cloze cards using payload sentence/blanks instead of legacy cloze columns", async () => {
    (useEditor as any).mockReturnValue(makeEditor());

    render(
      <LocalEditor
        initialContent="<p>hello</p>"
        onUpdate={vi.fn()}
        pageId="9f1fab8d-e1d0-495f-9f08-5202de8d1f91"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /create card/i }));
    const clozeTab = screen.getByRole("tab", { name: "Cloze Deletion" });
    fireEvent.mouseDown(clozeTab);
    fireEvent.click(clozeTab);
    const clozeInput = await waitFor(() =>
      screen.getByPlaceholderText("Example: The capital of France is {{Paris}}."),
    );
    fireEvent.change(clozeInput, {
      target: { value: "The capital of France is {{Paris}}." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Flashcard" }));

    await waitFor(() => {
      expect(createCardFromPageMock).toHaveBeenCalledTimes(1);
    });

    const request = createCardFromPageMock.mock.calls[0][0];
    expect(request.cardType).toBe("cloze");
    expect(request.cardPayload).toEqual({
      sentence: "The capital of France is _____.",
      blanks: ["Paris"],
    });
    expect(request).not.toHaveProperty("question");
    expect(request).not.toHaveProperty("answer");
    expect(request).not.toHaveProperty("clozeTemplate");
    expect(request).not.toHaveProperty("clozeAnswers");
  });

  it("creates image cards using payload and no legacy text card columns", async () => {
    const selection = new (NodeSelection as any)(
      {
        type: { name: "image" },
        attrs: {
          src: "https://assets.idealite.xyz/image-1.png",
          alt: "Diagram",
          nodeId: "img-node-1",
        },
      },
      1,
      1,
    );

    (useEditor as any).mockReturnValue(
      makeEditor({
        selection,
      }),
    );

    render(
      <LocalEditor
        initialContent="<p>hello</p>"
        onUpdate={vi.fn()}
        pageId="9f1fab8d-e1d0-495f-9f08-5202de8d1f91"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /create card/i }));
    fireEvent.change(screen.getByPlaceholderText("Enter answer for image flashcard..."), {
      target: { value: "This image shows ATP synthase." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Flashcard" }));

    await waitFor(() => {
      expect(createCardFromPageMock).toHaveBeenCalledTimes(1);
    });

    const request = createCardFromPageMock.mock.calls[0][0];
    expect(request.cardType).toBe("image");
    expect(request.cardPayload).toEqual({
      image_url: "https://assets.idealite.xyz/image-1.png",
      response: "This image shows ATP synthase.",
      alt: "Diagram",
    });
    expect(request).not.toHaveProperty("question");
    expect(request).not.toHaveProperty("answer");
    expect(request).not.toHaveProperty("clozeTemplate");
    expect(request).not.toHaveProperty("clozeAnswers");
  });

  it("blocks card creation on temp pages", () => {
    (useEditor as any).mockReturnValue(makeEditor());

    render(
      <LocalEditor initialContent="<p>hello</p>" onUpdate={vi.fn()} pageId="temp-123" />,
    );

    fireEvent.click(screen.getByRole("button", { name: /create card/i }));

    expect(toastErrorMock).toHaveBeenCalledWith(
      "Flashcards are available after this note syncs. Please try again in a few seconds.",
    );
    expect(createCardFromPageMock).not.toHaveBeenCalled();
  });
});
