import Dexie, { type Table } from 'dexie';

export interface LocalPage {
  id: string;
  title: string;
  titleKey?: string;
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

    this.version(2)
      .stores({
        pages: 'id, title, &titleKey, plainText, updatedAt, deleted, isSynced, isDaily',
        links: '++id, sourcePageId, targetPageId, [sourcePageId+targetPageId]',
        syncMetadata: 'key'
      })
      .upgrade(async (tx) => {
        const pages = tx.table<LocalPage, string>('pages');
        const allPages = await pages.toArray();
        const usedActiveTitleKeys = new Set<string>();

        for (const page of allPages) {
          const dedupedTitle = dedupeTitle(page.title, usedActiveTitleKeys, page.deleted === 1);
          await pages.update(page.id, {
            title: dedupedTitle,
            titleKey: page.deleted === 1 ? undefined : normalizeTitleKey(dedupedTitle),
          });
        }
      });

    this.pages.hook('creating', (_primKey, obj) => {
      const title = typeof obj.title === 'string' ? obj.title : '';
      const titleKey = normalizeTitleKey(title);
      obj.titleKey = obj.deleted === 1 || !titleKey ? undefined : titleKey;
    });

    this.pages.hook('updating', (modifications, _primKey, obj) => {
      const nextDeleted = Number(modifications.deleted ?? obj.deleted ?? 0);
      const titleTouched = Object.prototype.hasOwnProperty.call(modifications, 'title');
      const restoringFromDeleted = nextDeleted === 0 && Number(obj.deleted ?? 0) === 1;

      if (!titleTouched && !restoringFromDeleted && modifications.deleted !== 1) return;

      const nextTitle = titleTouched
        ? String(modifications.title ?? '')
        : String(obj.title ?? '');

      const titleKey = normalizeTitleKey(nextTitle);
      modifications.titleKey = nextDeleted === 1 || !titleKey ? undefined : titleKey;
      return modifications;
    });
  }
}

function normalizeTitleKey(title: string): string {
  return title.trim().toLocaleLowerCase();
}

function dedupeTitle(title: string, usedActiveTitleKeys: Set<string>, isDeleted: boolean): string {
  const baseTitle = title.trim() || 'Untitled';

  if (isDeleted) {
    return baseTitle;
  }

  let candidate = baseTitle;
  let suffix = 2;
  let candidateKey = normalizeTitleKey(candidate);

  while (candidateKey && usedActiveTitleKeys.has(candidateKey)) {
    candidate = `${baseTitle} (${suffix})`;
    candidateKey = normalizeTitleKey(candidate);
    suffix++;
  }

  if (candidateKey) {
    usedActiveTitleKeys.add(candidateKey);
  }

  return candidate;
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
