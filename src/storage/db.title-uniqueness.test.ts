import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db, wipeDatabase } from "./db";

function pageInput(id: string, title: string) {
  return {
    id,
    title,
    content: "",
    plainText: "",
    updatedAt: Date.now(),
    deleted: 0,
    isSynced: 0,
    isDaily: 0,
  };
}

describe("Local page title uniqueness", () => {
  beforeEach(async () => {
    await wipeDatabase();
  });

  it("rejects inserting a second page with the same title", async () => {
    await db.pages.add(pageInput("page-1", "My Note"));

    await expect(
      db.pages.add(pageInput("page-2", "My Note")),
    ).rejects.toThrow();
  });

  it("rejects renaming a page to an existing title", async () => {
    await db.pages.bulkAdd([
      pageInput("page-1", "Alpha"),
      pageInput("page-2", "Beta"),
    ]);

    await expect(db.pages.update("page-2", { title: "Alpha" })).rejects.toThrow();
  });
});
