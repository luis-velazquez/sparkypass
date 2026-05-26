// DELETE /api/push-tokens/[token]
//
// Unregister a push token. Called on logout, on app uninstall (via the token-
// invalidation webhook from Expo — out of v1 scope), or when the device's
// notification permission is revoked.
//
// Idempotent: deleting an unknown or already-deleted token returns 200.

import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { db, pushTokens } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const { token } = await params;
  if (!token) {
    return NextResponse.json(
      { error: "token path param required", code: "MISSING_FIELDS" },
      { status: 400 },
    );
  }

  // Scope the delete to the calling user — prevents anyone from purging
  // someone else's token by guessing it.
  await db
    .delete(pushTokens)
    .where(
      and(
        eq(pushTokens.token, decodeURIComponent(token)),
        eq(pushTokens.userId, session.user.id),
      ),
    );

  return NextResponse.json({ ok: true });
}
