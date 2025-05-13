import { IntegrationCredential } from "~/types/integration";

export interface IntegrationAdapter {
  syncPull(userId: string, cred: IntegrationCredential): Promise<void>;

  syncPush?(
    userId: string,
    cred: IntegrationCredential,
    payload: unknown,
  ): Promise<void>;
}

/* ---------- Example Obsidian adapter skeleton ---------- */
export const obsidianAdapter: IntegrationAdapter = {
  async syncPull(/* … */) {
    // Obsidian is client-push only → usually NOOP
  },
  async syncPush(userId, cred, payload) {
    // `payload` is array of notes coming from plugin
    // persist notes to DB here
  },
};
