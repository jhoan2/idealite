import { cache } from "react";
import { v4 as uuidv4 } from "uuid";

/**
 * Generate a consistent distinct_id for the current request.
 * Uses React's cache to ensure the same ID is returned across the request lifecycle.
 */
export const generateId = cache(() => {
  const id = uuidv4();
  return id;
});
