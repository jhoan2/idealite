import { render, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDailyNote } from "./useDailyNote";

const mocks = vi.hoisted(() => ({
  add: vi.fn(),
  first: vi.fn(),
  push: vi.fn(),
}));

vi.mock("~/storage/db", () => ({
  db: {
    pages: {
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          first: mocks.first,
        })),
      })),
      add: mocks.add,
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
  }),
}));

function DailyNoteHarness() {
  const { openDailyNote } = useDailyNote();

  useEffect(() => {
    void openDailyNote();
  }, [openDailyNote]);

  return null;
}

describe("useDailyNote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates new daily notes with HTML content instead of serialized JSON", async () => {
    mocks.first.mockResolvedValue(undefined);
    mocks.add.mockResolvedValue(undefined);

    render(<DailyNoteHarness />);

    await waitFor(() => {
      expect(mocks.add).toHaveBeenCalledTimes(1);
    });

    const createdNote = mocks.add.mock.calls[0][0];
    expect(createdNote.id).toMatch(/^temp-/);
    expect(createdNote.content).toBe("");
    expect(createdNote.plainText).toBe("");
    expect(mocks.push).toHaveBeenCalledWith(`/notes/${createdNote.id}`);
  });
});
