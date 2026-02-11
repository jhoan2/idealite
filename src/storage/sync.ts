import { db, type LocalPage } from './db';

/**
 * Manager to handle background synchronization between Dexie and Postgres.
 */
export class SyncManager {
  private static isSyncing = false;

  static async sync() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      await db.syncMetadata.put({ key: 'sync_status', value: 'syncing' });
      await this.push();
      await this.pull();
      await db.syncMetadata.put({ key: 'sync_status', value: 'synced' });
    } catch (e) {
      console.error('Sync failed:', e);
      await db.syncMetadata.put({ key: 'sync_status', value: 'error' });
    } finally {
      this.isSyncing = false;
    }
  }

  private static async pull() {
    const lastSyncMeta = await db.syncMetadata.get('last_synced_at');
    const since = lastSyncMeta?.value || '';

    const response = await fetch(`/api/v1/sync/pages/pull?since=${encodeURIComponent(since)}`);
    if (!response.ok) return;

    const data = await response.json();
    if (!data.success || !data.pages) return;

    if (data.pages.length > 0) {
      const localPages: LocalPage[] = data.pages.map((p: any) => ({
        id: p.id,
        title: p.title,
        content: p.content || '',
        plainText: '', 
        updatedAt: new Date(p.updated_at).getTime(),
        deleted: p.deleted ? 1 : 0,
        isSynced: 1,
        isDaily: p.title.match(/^\d{4}-\d{2}-\d{2}$/) ? 1 : 0
      }));

      await db.pages.bulkPut(localPages);
    }

    await db.syncMetadata.put({ key: 'last_synced_at', value: data.server_timestamp });
  }

  private static async push() {
    const dirtyPages = await db.pages.where('isSynced').equals(0).toArray();
    if (dirtyPages.length === 0) return;

    // Separate creates (temp- ids) from updates (UUIDs)
    const creates = dirtyPages
      .filter(p => p.id.startsWith('temp-'))
      .map(p => ({
        client_id: 0, // Simplified for this draft
        title: p.title,
        content: p.content,
        content_type: 'page' as const,
        created_at: new Date(p.updatedAt).toISOString(),
        updated_at: new Date(p.updatedAt).toISOString(),
      }));

    const updates = dirtyPages
      .filter(p => !p.id.startsWith('temp-'))
      .map(p => ({
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
        creates,
        updates,
        last_synced_at: (await db.syncMetadata.get('last_synced_at'))?.value
      })
    });

    if (!response.ok) return;

    const data = await response.json();
    if (data.success) {
      await db.transaction('rw', db.pages, db.links, async () => {
        // 1. Handle ID Swapping for newly created pages
        if (data.created && data.created.length > 0) {
          for (const created of data.created) {
            // Find the local record that was just created (matching by title for now)
            // In a better impl, we'd use client_id mapping
            const localTempPage = await db.pages
              .where('title').equals(created.final_title)
              .and(p => p.id.startsWith('temp-'))
              .first();

            if (localTempPage) {
              const oldId = localTempPage.id;
              const newId = created.server_id;

              // Move page to new ID.
              // Delete old row first to avoid unique titleKey conflicts during ID swap.
              await db.pages.delete(oldId);
              await db.pages.add({
                ...localTempPage,
                id: newId,
                isSynced: 1,
                updatedAt: new Date(created.updated_at).getTime()
              });

              // Update all local backlinks pointing to this temp ID
              await db.links.where('targetPageId').equals(oldId).modify({ targetPageId: newId });
              await db.links.where('sourcePageId').equals(oldId).modify({ sourcePageId: newId });

              // Rewrite stale temp-id references in note HTML content.
              // Mark changed pages dirty so corrected links are pushed upstream.
              const now = Date.now();
              const pagesWithOldRefs = await db.pages
                .filter((p) => typeof p.content === 'string' && p.content.includes(oldId))
                .toArray();

              for (const page of pagesWithOldRefs) {
                const rewrittenContent = rewriteNoteContentPageRefs(page.content, oldId, newId);
                if (rewrittenContent !== page.content) {
                  await db.pages.update(page.id, {
                    content: rewrittenContent,
                    updatedAt: now,
                    isSynced: 0,
                  });
                }
              }
            }
          }
        }

        // 2. Mark updated pages as synced
        if (data.updated && data.updated.length > 0) {
          const syncedIds = data.updated.map((u: any) => u.server_id);
          await db.pages.where('id').anyOf(syncedIds).modify({ isSynced: 1 });
        }
      });
    }
  }
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function rewriteNoteContentPageRefs(content: string, oldId: string, newId: string) {
  if (!content || !oldId || oldId === newId) return content;

  const escapedOldId = escapeRegex(oldId);
  let rewritten = content.replace(
    new RegExp(`(data-page-id=["'])${escapedOldId}(["'])`, 'g'),
    `$1${newId}$2`
  );
  rewritten = rewritten.replace(
    new RegExp(`(href=["']\\/notes\\/)${escapedOldId}(["'])`, 'g'),
    `$1${newId}$2`
  );

  return rewritten;
}
