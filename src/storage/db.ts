import Dexie, { type Table } from 'dexie';

export interface LocalPage {
  id: string;
  title: string;
  content: string; // TipTap JSON string
  plainText: string; // For instant local search
  updatedAt: number; // Timestamp
  deleted: number; // 0 or 1 for efficient indexing
  isSynced: number; // 0 = needs push, 1 = synced
  isDaily: number; // 0 = standard, 1 = daily note
}

export interface LocalLink {
  id?: number;
  sourcePageId: string;
  targetPageId: string;
}

export interface SyncMetadata {
  key: string;
  value: string | number;
}

export class IdealiteDB extends Dexie {
  pages!: Table<LocalPage>;
  links!: Table<LocalLink>;
  syncMetadata!: Table<SyncMetadata>;

  constructor() {
    super('IdealiteDB');
    
    // Schema definition
    // Note: plainText is indexed here so we can do fast content search
    this.version(1).stores({
      pages: 'id, title, plainText, updatedAt, deleted, isSynced, isDaily',
      links: '++id, sourcePageId, targetPageId, [sourcePageId+targetPageId]',
      syncMetadata: 'key'
    });
  }
}

export const db = new IdealiteDB();

/**
 * Utility to securely wipe all user data from the local database.
 * Used during logout or user switch.
 */
export async function wipeDatabase() {
  await db.transaction('rw', db.pages, db.links, db.syncMetadata, async () => {
    await Promise.all([
      db.pages.clear(),
      db.links.clear(),
      db.syncMetadata.clear()
    ]);
  });
}
