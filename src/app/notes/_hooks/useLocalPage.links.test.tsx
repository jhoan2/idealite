import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { db, wipeDatabase } from "~/storage/db";
import { useLocalPage } from "./useLocalPage";

function localPageInput(id: string, title: string) {
  return {
    id,
    title,
    content: "",
    plainText: "",
    updatedAt: Date.now(),
    deleted: 0,
    isSynced: 1,
    isDaily: 0,
  };
}

describe("useLocalPage backlink indexing", () => {
  beforeEach(async () => {
    await wipeDatabase();
  });

  it("indexes backlinks from HTML links with data-page-id", async () => {
    await db.pages.add(localPageInput("source-page", "Source"));
    const { result } = renderHook(() => useLocalPage("source-page"));

    const html = `
      <p>
        <a href="/notes/target-1" data-page-id="target-1">Target One</a>
      </p>
    `;

    await act(async () => {
      await result.current.savePage({ content: html, plainText: "Target One" });
    });

    const links = await db.links.where("sourcePageId").equals("source-page").toArray();
    expect(links).toHaveLength(1);
    expect(links[0]?.targetPageId).toBe("target-1");
  });

  it("still indexes backlinks from legacy TipTap JSON content", async () => {
    await db.pages.add(localPageInput("source-page", "Source"));
    const { result } = renderHook(() => useLocalPage("source-page"));

    const legacyJson = JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Legacy",
              marks: [
                {
                  type: "link",
                  attrs: { pageId: "target-json" },
                },
              ],
            },
          ],
        },
      ],
    });

    await act(async () => {
      await result.current.savePage({ content: legacyJson, plainText: "Legacy" });
    });

    const links = await db.links.where("sourcePageId").equals("source-page").toArray();
    expect(links).toHaveLength(1);
    expect(links[0]?.targetPageId).toBe("target-json");
  });
});
