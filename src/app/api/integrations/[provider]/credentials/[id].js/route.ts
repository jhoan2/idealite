import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { integrationCredentials } from "~/server/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { provider: string; id: string } },
) {
  try {
    const { provider, id } = params;

    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Find the user's UUID from the users table
    const dbUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.clerk_id, user.id),
      columns: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Revoke the credential by setting revoked_at
    await db
      .update(integrationCredentials)
      .set({ revoked_at: new Date() })
      .where(
        and(
          eq(integrationCredentials.id, id),
          eq(integrationCredentials.user_id, dbUser.id),
          eq(integrationCredentials.provider, provider),
        ),
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking credential:", error);
    return NextResponse.json(
      { success: false, error: "Failed to revoke credential" },
      { status: 500 },
    );
  }
}
