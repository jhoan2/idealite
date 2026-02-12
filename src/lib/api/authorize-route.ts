import "server-only";

import { currentUser } from "@clerk/nextjs/server";
import { env } from "~/env";

/**
 * Shared auth gate for API route handlers.
 * Allows either:
 * 1) Signed-in Clerk user mapped to an app user id
 * 2) Internal API key (for non-browser eval/scripts)
 */
export async function authorizeRoute(req?: Request): Promise<boolean> {
  const user = await currentUser();
  if (user?.externalId) return true;

  const internalApiKey = env.INTERNAL_EVAL_API_KEY;
  if (!internalApiKey || !req) return false;

  const xApiKey = req.headers.get("x-api-key");
  const authorization = req.headers.get("authorization");
  const bearerKey = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : null;

  const providedKey = xApiKey?.trim() || bearerKey;
  if (!providedKey) return false;

  return providedKey === internalApiKey;
}
