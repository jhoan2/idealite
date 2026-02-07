import { useLiveQuery } from 'dexie-react-hooks';
import { db, type LocalPage } from '~/storage/db';
import { useCallback } from 'react';

/**
 * Hook to manage a single note's state using local storage.
 * Handles instant reading and link indexing.
 */
export function useLocalPage(pageId: string | undefined) {
  // 1. Instant reactive read
  const page = useLiveQuery(
    () => (pageId ? db.pages.get(pageId) : undefined),
    [pageId]
  );

  // 2. High-performance save (local only)
  const savePage = useCallback(async (updates: Partial<LocalPage>) => {
    if (!pageId) return;

    await db.transaction('rw', db.pages, db.links, async () => {
      // Update the page
      await db.pages.update(pageId, {
        ...updates,
        updatedAt: Date.now(),
        isSynced: 0, // Mark for background sync
      });

      // If content changed, re-index backlinks locally
      if (updates.content) {
        await updateLocalLinks(pageId, updates.content);
      }
    });
  }, [pageId]);

  return {
    page,
    savePage,
    isLoading: page === undefined && !!pageId,
  };
}

/**
 * Parses TipTap JSON for [[links]] and updates the local links table.
 * This ensures backlinks are always instant.
 */
async function updateLocalLinks(sourceId: string, contentJson: string) {
  try {
    const content = JSON.parse(contentJson);
    const linkedIds = new Set<string>();

    // Recursive search for marks with data-page-id (from your PageMention.tsx logic)
    const findLinks = (node: any) => {
      if (node.marks) {
        for (const mark of node.marks) {
          if (mark.type === 'link' && mark.attrs?.pageId) {
            linkedIds.add(mark.attrs.pageId);
          }
        }
      }
      if (node.content) {
        node.content.forEach(findLinks);
      }
    };

    findLinks(content);

    // Update the links table: Remove old, Add new
    await db.links.where('sourcePageId').equals(sourceId).delete();
    
    if (linkedIds.size > 0) {
      const newLinks = Array.from(linkedIds).map(targetId => ({
        sourcePageId: sourceId,
        targetPageId: targetId
      }));
      await db.links.bulkAdd(newLinks);
    }
  } catch (e) {
    console.error('Failed to index local links:', e);
  }
}
