// DELETE /api/account
//
// Soft-delete the authenticated user. Required by Apple Guideline 5.1.1(v) —
// any app offering in-app signup must offer in-app account deletion.
//
// Per audit OQ-resolution (plan §D-17): we use a 30-day soft-delete grace
// period. This endpoint marks deleted_at; a daily Vercel Cron sweeps anything
// older than 30 days for hard delete.

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, users } from "@/lib/db";
import { stripe } from "@/lib/stripe";

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
      stripeSubscriptionId: users.stripeSubscriptionId,
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

  // Cancel any active Stripe subscription at the end of the current period.
  // We use cancel_at_period_end=true (not immediate) so users keep access for
  // what they already paid for — same behavior as the Stripe customer portal's
  // own cancel button. Failures here are logged but don't block the delete:
  // the hard-delete cron will eventually purge the user row, and the Stripe
  // sub will either lapse naturally or appear in the Stripe dashboard as a
  // billing-against-no-user anomaly we resolve manually. We don't want a
  // transient Stripe outage to prevent users from deleting their account.
  //
  // Apple IAP cancellation is NOT initiated here. Apple's rules require
  // subscription management to happen via the App Store (Settings → Apple ID
  // → Subscriptions), and developers cannot programmatically cancel Apple
  // subscriptions on behalf of users. The mobile delete UX should surface a
  // link explaining this — handled client-side.
  let stripeSubCancelled = false;
  if (existing.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.update(existing.stripeSubscriptionId, {
        cancel_at_period_end: true,
        metadata: { cancelled_via: "account_delete", cancelled_at: now.toISOString() },
      });
      stripeSubCancelled = true;
    } catch (err) {
      console.error(
        "[account/delete] Stripe subscription cancel failed for",
        existing.stripeSubscriptionId,
        err,
      );
    }
  }

  await db
    .update(users)
    .set({ deletedAt: now, updatedAt: now })
    .where(eq(users.id, userId));

  return NextResponse.json({
    ok: true,
    deletedAt: now.toISOString(),
    hardDeleteAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    alreadyDeleted: false,
    stripeSubCancelled,
    appleSubscriptionNote:
      existing.subscriptionSource === "apple"
        ? "Apple subscriptions must be cancelled in iOS Settings → Apple ID → Subscriptions. Your account data will be deleted regardless after the 30-day grace period."
        : null,
  });
}
