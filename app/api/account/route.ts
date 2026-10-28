// DELETE /api/account
//
// Soft-delete the authenticated user. Required by Apple Guideline 5.1.1(v) —
// any app offering in-app signup must offer in-app account deletion.
//
// Per audit OQ-resolution (plan §D-17): we use a 30-day soft-delete grace
// period. This endpoint marks deleted_at; a daily Vercel Cron sweeps anything
// older than 30 days for hard delete.

import { NextResponse, after } from "next/server";
import { and, eq, isNotNull } from "drizzle-orm";
import { auth } from "@/auth";
import { db, users, linkedProviders } from "@/lib/db";
import { revokeAppleRefreshToken } from "@/lib/apple-revocation";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const userId = session.user.id;
  const now = new Date();

  // Idempotent: if already soft-deleted, return success without re-setting the
  // timestamp (which would reset the grace clock — bad).
  const [existing] = await db
    .select({
      deletedAt: users.deletedAt,
      subscriptionSource: users.subscriptionSource,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!existing) {
    return NextResponse.json(
      { error: "Account not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  if (existing.deletedAt) {
    return NextResponse.json({
      ok: true,
      deletedAt: existing.deletedAt.toISOString(),
      hardDeleteAt: new Date(
        existing.deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      alreadyDeleted: true,
    });
  }

  // Apple IAP cancellation is NOT initiated here. Apple's rules require
  // subscription management to happen via the App Store (Settings → Apple ID
  // → Subscriptions), and developers cannot programmatically cancel Apple
  // subscriptions on behalf of users. The mobile delete UX surfaces this —
  // handled client-side. (Web/Stripe billing removed 2026-08.)
  await db
    .update(users)
    .set({ deletedAt: now, updatedAt: now })
    .where(eq(users.id, userId));

  // Revoke the Sign in with Apple grant (5.1.1(v)) — after the response, so
  // a slow/hung appleid.apple.com can never stall the user's deletion (the
  // soft-delete above is already committed). Best-effort: on success the
  // stored token is cleared; on failure it is KEPT so the hard-delete cron
  // retries before the row is purged.
  after(async () => {
    try {
      const appleLinks = await db
        .select({ id: linkedProviders.id, token: linkedProviders.appleRefreshToken })
        .from(linkedProviders)
        .where(
          and(
            eq(linkedProviders.userId, userId),
            eq(linkedProviders.provider, "apple"),
            isNotNull(linkedProviders.appleRefreshToken),
          ),
        );
      for (const link of appleLinks) {
        if (await revokeAppleRefreshToken(link.token!)) {
          await db
            .update(linkedProviders)
            .set({ appleRefreshToken: null })
            .where(eq(linkedProviders.id, link.id));
        }
      }
    } catch (e) {
      console.warn("[account] SiwA revocation failed", e);
    }
  });

  return NextResponse.json({
    ok: true,
    deletedAt: now.toISOString(),
    hardDeleteAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    alreadyDeleted: false,
    appleSubscriptionNote:
      existing.subscriptionSource === "apple"
        ? "Apple subscriptions must be cancelled in iOS Settings → Apple ID → Subscriptions. Your account data will be deleted regardless after the 30-day grace period."
        : null,
  });
}
