import { db } from "~/server/db";
import { integrationCredentials } from "~/server/db/schema";
import { hashMachineKey, decrypt, encrypt } from "./crypto";
import { integrationRegistry, Provider } from "./registry";
import { eq } from "drizzle-orm";

export async function validateCredential(provider: Provider, token: string) {
  // Machine keys arrive as plaintext; OAuth/PAT tokens never leave the server
  // decrypt used for OAuth/PAT tokens
  const isMachine = integrationRegistry[provider].authType === "machine";

  const hashed = isMachine
    ? hashMachineKey(token.replace(/^idealite_sk_/, ""))
    : undefined;

  const cred = await db.query.integrationCredentials.findFirst({
    where: (c, { eq, and, isNull }) =>
      and(
        eq(c.provider, provider),
        isMachine
          ? eq(c.hashed_token, hashed!)
          : eq(c.access_token_enc, encrypt(token)),
      ),
  });

  if (
    !cred ||
    cred.revoked_at ||
    (cred.expires_at && cred.expires_at < new Date())
  ) {
    return null;
  }

  await db
    .update(integrationCredentials)
    .set({ last_used: new Date() })
    .where(eq(integrationCredentials.id, cred.id));

  return cred;
}
