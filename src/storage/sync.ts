import { db, type LocalPage } from './db';

/**
 * Manager to handle background synchronization between Dexie and Postgres.
 */
export class SyncManager {
  private static isSyncing = false;

  /**
   * Main sync entry point. Runs both pull and push.
   */
  static async sync() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      await this.push();
      await this.pull();
    } catch (e) {
      console.error('Sync failed:', e);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Pulls changes from the server.
   */
  private static async pull() {
    const lastSyncMeta = await db.syncMetadata.get('last_synced_at');
    const since = lastSyncMeta?.value || '';

    const response = await fetch(`/api/v1/sync/pages/pull?since=${encodeURIComponent(since)}`);
    if (!response.ok) return;

    const data = await response.json();
    if (!data.success) return;

    // Batch upsert to Dexie
    if (data.pages.length > 0) {
      const localPages: LocalPage[] = data.pages.map((p: any) => ({
        id: p.id,
        title: p.title,
        content: p.content || '',
        plainText: '', // We can generate this locally if needed
        updatedAt: new Date(p.updated_at).getTime(),
        deleted: p.deleted ? 1 : 0,
        isSynced: 1,
        isDaily: p.title.match(/^\d{4}-\d{2}-\d{2}$/) ? 1 : 0
      }));

      await db.pages.bulkPut(localPages);
    }

    // Save checkpoint
    await db.syncMetadata.put({ key: 'last_synced_at', value: data.server_timestamp });
  }

  /**
   * Pushes local changes to the server.
   */
  private static async push() {
    const dirtyPages = await db.pages.where('isSynced').equals(0).toArray();
    if (dirtyPages.length === 0) return;

    const lastSyncMeta = await db.syncMetadata.get('last_synced_at');

    // Separate new pages from updated pages
    // For now, we'll treat everything as an update if it has a UUID format id
    // In a real impl, we might use a prefix for 'temp' IDs
    const updates = dirtyPages.map(p => ({
      server_id: p.id,
      title: p.title,
      content: p.content,
      updated_at: new Date(p.updatedAt).toISOString(),
      deleted: p.deleted === 1
    }));

    const response = await fetch('/api/v1/sync/pages/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        updates,
        creates: [], // Handle creates properly once we have temp ID logic
        last_synced_at: lastSyncMeta?.value
      })
    });

    if (!response.ok) return;

    const data = await response.json();
    if (data.success) {
      // Mark as synced
      const syncedIds = data.updated.map((u: any) => u.server_id);
      await db.pages.where('id').anyOf(syncedIds).modify({ isSynced: 1 });
    }
  }
}
