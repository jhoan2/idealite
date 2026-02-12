import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PageFlashcardsPanel } from "./PageFlashcardsPanel";

const { deleteCardMock, updateCardMock, toastSuccessMock, toastErrorMock } =
  vi.hoisted(() => ({
    deleteCardMock: vi.fn<(id: string) => Promise<unknown>>(),
    updateCardMock: vi.fn<(input: unknown) => Promise<unknown>>(),
    toastSuccessMock: vi.fn<(message: string) => void>(),
    toastErrorMock: vi.fn<(message: string) => void>(),
  }));

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "page-1" }),
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={(props.alt as string | undefined) ?? ""} {...props} />
  ),
}));

vi.mock("~/server/actions/card", () => ({
  deleteCard: deleteCardMock,
  updateCard: updateCardMock,
}));

vi.mock("sonner", () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}));

const baseCard = {
  id: "card-1",
  card_type: "qa",
  card_payload: {
    prompt: "What is ATP?",
    response: "Cell energy currency",
  },
  card_payload_version: 1,
  content: "Cell energy currency",
  image_cid: null,
  description: null,
  next_review: null,
  status: "active",
};

function setupFetchMock() {
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const method = init?.method ?? "GET";
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      if (method === "DELETE" && url.includes("/api/v1/pages/page-1/flashcards")) {
        return {
          ok: true,
          json: async () => ({ deletedCount: 1 }),
        } as Response;
      }

      if (method === "GET" && url.includes("/api/v1/pages/page-1/flashcards")) {
        return {
          ok: true,
          json: async () => ({ flashcards: [baseCard] }),
        } as Response;
      }

      return {
        ok: true,
        json: async () => ({}),
      } as Response;
    },
  );

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function openCardActionMenu() {
  await screen.findByText("What is ATP?");
  const trigger = screen.getByRole("button", { name: "Flashcard actions" });
  const user = userEvent.setup();
  await user.click(trigger);
  await screen.findByRole("menuitem", { name: "Batch delete flashcards" });
}

describe("PageFlashcardsPanel actions", () => {
  beforeAll(() => {
    global.ResizeObserver = class ResizeObserver {
      observe(_target?: Element) {
        void _target;
      }
      unobserve(_target?: Element) {
        void _target;
      }
      disconnect() {
        return;
      }
    };
  });

  beforeEach(() => {
    vi.clearAllMocks();
    deleteCardMock.mockResolvedValue({});
    updateCardMock.mockResolvedValue({});
    setupFetchMock();
  });

  it("shows all four action menu items", async () => {
    render(<PageFlashcardsPanel />);

    await openCardActionMenu();

    expect(
      screen.getByRole("menuitem", { name: "Batch delete flashcards" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Delete flashcard" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Suspend flashcard" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Edit flashcard" }),
    ).toBeInTheDocument();
  });

  it("batch deletes flashcards from the current page", async () => {
    const fetchMock = setupFetchMock();
    render(<PageFlashcardsPanel />);

    await openCardActionMenu();
    fireEvent.click(
      screen.getByRole("menuitem", { name: "Batch delete flashcards" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/v1/pages/page-1/flashcards",
        expect.objectContaining({
          method: "DELETE",
        }),
      );
    });
  });

  it("deletes a single flashcard", async () => {
    render(<PageFlashcardsPanel />);

    await openCardActionMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete flashcard" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(deleteCardMock).toHaveBeenCalledWith("card-1");
    });
  });

  it("suspends a flashcard", async () => {
    render(<PageFlashcardsPanel />);

    await openCardActionMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "Suspend flashcard" }));

    await waitFor(() => {
      expect(updateCardMock).toHaveBeenCalledWith({
        id: "card-1",
        status: "suspended",
        next_review: null,
      });
    });
  });

  it("opens edit modal and saves flashcard changes", async () => {
    render(<PageFlashcardsPanel />);

    await openCardActionMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit flashcard" }));

    const questionInput = await screen.findByLabelText("Question");
    const answerInput = screen.getByLabelText("Answer");
    fireEvent.change(questionInput, { target: { value: "What is NADH?" } });
    fireEvent.change(answerInput, { target: { value: "Reduced electron carrier" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(updateCardMock).toHaveBeenCalledWith({
        id: "card-1",
        cardPayload: {
          prompt: "What is NADH?",
          response: "Reduced electron carrier",
        },
        cardPayloadVersion: 1,
        content: "Reduced electron carrier",
      });
    });
  });
});
