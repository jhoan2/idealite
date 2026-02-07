import "fake-indexeddb/auto"; // MUST be first
import { vi, describe, it, expect, beforeEach } from "vitest";
import { db, wipeDatabase } from "./db";
import { SyncManager } from "./sync";

// Mock the global fetch
global.fetch = vi.fn();

describe("Sync Robustness & Privacy", () => {
  beforeEach(async () => {
    // Reset DB state for every test
    await wipeDatabase();
    vi.clearAllMocks();
  });

  describe("Privacy", () => {
    it("should clear local data on logout", async () => {
      // 1. Setup: User A has data
      await db.pages.add({
        id: "user-a-note",
        title: "User A Secret",
        content: "",
        plainText: "",
        updatedAt: Date.now(),
        deleted: 0,
        isSynced: 1,
        isDaily: 0
      });

      // 2. Simulate Logout Action
      const logout = async () => {
        await wipeDatabase();
      };
      
      await logout();

      // 3. Verify Data is GONE
      const count = await db.pages.count();
      expect(count).toBe(0); 
    });
  });

  describe("ID Swapping (Offline Create)", () => {
    it("should swap temp ID for server ID after push", async () => {
      // 1. Setup: Create offline note with temp ID
      const tempId = "temp-123";
      await db.pages.add({
        id: tempId,
        title: "Offline Note",
        content: JSON.stringify({ type: "doc", content: [] }),
        plainText: "",
        updatedAt: Date.now(),
        deleted: 0,
        isSynced: 0,
        isDaily: 0
      });

      // 2. Setup: Backlink pointing to this temp ID
      await db.links.add({
        sourcePageId: "other-page",
        targetPageId: tempId
      });

      // 3. Mock Server Response (Success with new ID)
      const serverId = "server-uuid-456";
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          created: [{ client_id: 0, server_id: serverId, final_title: "Offline Note" }],
          updated: []
        })
      });

      // 4. Trigger Sync
      await SyncManager.sync();

      // 5. Verify ID Swap
      const oldPage = await db.pages.get(tempId);
      expect(oldPage).toBeUndefined();

      const newPage = await db.pages.get(serverId);
      expect(newPage).toBeDefined();

      const link = await db.links.where("targetPageId").equals(serverId).first();
      expect(link).toBeDefined();
    });
  });
});