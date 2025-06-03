import { NextRequest, NextResponse } from "next/server";
import { tryCatch } from "~/lib/tryCatch";
import { validateCredential } from "~/lib/integrations/validate";
import { users } from "~/server/db/schema";
import { db } from "~/server/db";
import { Provider } from "~/lib/integrations/registry";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: { provider: Provider } },
) {
  return tryCatch(
    (async () => {
      const provider = params.provider;
      const auth = req.headers.get("authorization") ?? "";
      const token = auth.replace(/^Bearer\s+/i, "");
      if (!token) throw new Error("Missing bearer token");

      const cred = await validateCredential(provider, token);
      if (!cred)
        return NextResponse.json(
          { error: "Invalid or expired" },
          { status: 401 },
        );

      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, cred.user_id))
        .limit(1)
        .then((r) => r[0]!);

      return NextResponse.json({
        userId: user.id,
        email: user.email,
        quotas: {
          /* …future plan… */
        },
      });
    })(),
  );
}
