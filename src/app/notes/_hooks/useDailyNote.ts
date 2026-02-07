import { format } from 'date-fns';
import { db } from '~/storage/db';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

/**
 * Hook to manage Daily Notes.
 * Automatically finds or creates a note titled 'YYYY-MM-DD'.
 */
export function useDailyNote() {
  const router = useRouter();

  const openDailyNote = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // 1. Check if it already exists
    const existing = await db.pages.where('title').equals(today).first();

    if (existing) {
      router.push(`/notes/${existing.id}`);
      return;
    }

    // 2. Create it if missing
    const id = uuidv4();
    await db.pages.add({
      id,
      title: today,
      content: JSON.stringify({ type: 'doc', content: [] }),
      plainText: '',
      updatedAt: Date.now(),
      deleted: 0,
      isSynced: 0,
      isDaily: 1
    });

    router.push(`/notes/${id}`);
  };

  return { openDailyNote };
}
