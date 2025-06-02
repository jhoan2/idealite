import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "~/server/db";
import { integrationCredentials } from "~/server/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { integrationRegistry, Provider } from "~/lib/integrations/registry";
import { generateMachineKey, encrypt } from "~/lib/integrations/crypto";
import { and, eq } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: { provider: Provider } },
) {
  try {
    const provider = params.provider;
    const reg = integrationRegistry[provider];
    if (!reg) {
      return NextResponse.json(
        { success: false, error: "Unknown provider" },
        { status: 400 },
      );
    }

    const user = await currentUser();
    const userId = user?.externalId;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 },
      );
    }

    // --- create new credential row ---
    let plaintextToReturn: string | null = null;

    const base = {
      user_id: userId,
      provider,
      type: reg.authType,
      scope: [...reg.scopes] as string[],
      created_at: new Date(),
    };

    if (reg.authType === "machine") {
      // Obsidian: generate key + hash
      const { plaintext, hash } = generateMachineKey();
      plaintextToReturn = plaintext;
      await db.insert(integrationCredentials).values({
        ...base,
        hashed_token: hash,
      });
    } else {
      // For PAT / OAuth we expect token in body
      const body = await req.json();
      const schema = z.object({ accessToken: z.string() });
      const { accessToken } = schema.parse(body);

      await db.insert(integrationCredentials).values({
        ...base,
        access_token_enc: encrypt(accessToken),
      });
    }

    return NextResponse.json(
      { success: true, key: plaintextToReturn }, // null for OAuth/PAT flows
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating credential:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { provider: Provider } },
) {
  try {
    const { provider } = params;

    const user = await currentUser();
    const userId = user?.externalId;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get all credentials for this user and provider
    const credentials = await db.query.integrationCredentials.findMany({
      where: (c, { and, eq }) =>
        and(eq(c.user_id, userId), eq(c.provider, provider)),
      // Don't return sensitive info
      columns: {
        id: true,
        provider: true,
        created_at: true,
        last_used: true,
        revoked_at: true,
        // Exclude: hashed_token, access_token_enc, refresh_token_enc
      },
      orderBy: (c, { desc }) => [desc(c.created_at)],
    });

    return NextResponse.json({
      success: true,
      credentials,
    });
  } catch (error) {
    console.error("Error fetching credentials:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch credentials" },
      { status: 500 },
    );
  }
}
