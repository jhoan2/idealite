import { useLiveQuery } from 'dexie-react-hooks';
import Dexie from 'dexie';
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

    try {
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
    } catch (error) {
      if (error instanceof Dexie.ConstraintError) {
        console.warn('Duplicate title blocked in local DB');
        return;
      }
      throw error;
    }
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
    const linkedIds = new Set<string>();

    // Legacy path: content stored as TipTap JSON string.
    try {
      const content = JSON.parse(contentJson);
      const findLinks = (node: any) => {
        if (node?.marks) {
          for (const mark of node.marks) {
            if (mark.type === 'link' && mark.attrs?.pageId) {
              linkedIds.add(String(mark.attrs.pageId));
            }
          }
        }
        if (node?.content) {
          node.content.forEach(findLinks);
        }
      };
      findLinks(content);
    } catch {
      // Non-JSON content is expected in /notes (HTML from TipTap getHTML()).
    }

    // Primary path: parse HTML and read page IDs from link attributes.
    if (typeof DOMParser !== 'undefined') {
      const doc = new DOMParser().parseFromString(contentJson, 'text/html');
      const anchors = doc.querySelectorAll('a[data-page-id]');
      for (const anchor of anchors) {
        const pageId = anchor.getAttribute('data-page-id');
        if (pageId) {
          linkedIds.add(pageId);
        }
      }
    }

    // Update the links table: Remove old, Add new
    await db.links.where('sourcePageId').equals(sourceId).delete();
    
    const filteredIds = Array.from(linkedIds).filter((targetId) => targetId && targetId !== sourceId);

    if (filteredIds.length > 0) {
      const newLinks = filteredIds.map(targetId => ({
        sourcePageId: sourceId,
        targetPageId: targetId
      }));
      await db.links.bulkAdd(newLinks);
    }
  } catch (e) {
    console.error('Failed to index local links:', e);
  }
}
