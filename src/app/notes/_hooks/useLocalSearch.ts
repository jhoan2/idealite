import { useLiveQuery } from "dexie-react-hooks";
import { db } from "~/storage/db";

/**
 * Hook to perform instant title search against local Dexie DB.
 */
export function useLocalSearch(query: string) {
  return useLiveQuery(
    async () => {
      if (!query.trim()) {
        return await db.pages
          .orderBy("updatedAt")
          .reverse()
          .filter((p) => p.deleted === 0)
          .limit(10)
          .toArray();
      }

      // Instant prefix/title search
      return await db.pages
        .where("title")
        .startsWithIgnoreCase(query)
        .and((p) => p.deleted === 0)
        .limit(10)
        .toArray();
    },
    [query]
  );
}
