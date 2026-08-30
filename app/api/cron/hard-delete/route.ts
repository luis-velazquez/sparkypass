// GET /api/cron/hard-delete
//
// Vercel Cron — daily 06:00 UTC (vercel.json). Hard-deletes users whose
// deleted_at is older than 30 days. The 30-day grace is required by Apple
// Guideline 5.1.1(v) intent + our own restore-on-sign-in UX.
//
// Cascade deletes (via ON DELETE CASCADE foreign keys) drop all dependent
// rows: user_progress, study_sessions, bookmarks, flashcard_bookmarks,
// quiz_results, question_srs, circuit_breaker_state, friendships, power_up_purchases,
// game_pack_purchases, game_mastery_state, watts_transactions, referrals,
// refresh_tokens, push_tokens, linked_providers, sync_event_log, feedback,
// verification_tokens, password_reset_tokens.
//
// What DOESN'T cascade and we should clean up explicitly: link_codes (the
// email-anchored pre-auth linking codes — they reference user by email, not
// FK). For v1 we let them age out via expires_at — they're 10 minutes long.
//
// Apple subscriptions cannot be canceled server-side (Apple owns the billing
// relationship); the mobile delete flow tells users to cancel in iOS Settings.
// Purging the row is safe regardless — entitlement events for an unknown
// app_user_id are ack'd and ignored by the RevenueCat webhook.

import { NextRequest, NextResponse } from "next/server";
import { lt, and, eq, inArray, isNotNull } from "drizzle-orm";
import { db, users, linkedProviders } from "@/lib/db";
import { revokeAppleRefreshToken } from "@/lib/apple-revocation";
import { verifyCronRequest } from "@/lib/cron-auth";

const GRACE_DAYS = 30;

export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const now = new Date();
  const cutoff = new Date(now.getTime() - GRACE_DAYS * 24 * 60 * 60 * 1000);

  // Two-step so we can log what we're about to delete.
  const candidates = await db
    .select({ id: users.id, email: users.email, deletedAt: users.deletedAt })
    .from(users)
    .where(and(isNotNull(users.deletedAt), lt(users.deletedAt, cutoff)));

  if (candidates.length === 0) {
    return NextResponse.json({
      ok: true,
      cutoff: cutoff.toISOString(),
      deleted: 0,
      ran_at: now.toISOString(),
    });
  }

  // Anonymize log: print ID prefix + masked email so we don't dump PII at info level.
  for (const u of candidates) {
    const maskedEmail = u.email.replace(/(^.).*(@.*$)/, "$1***$2");
    console.log(
      "[cron/hard-delete] purging user",
      u.id.slice(0, 8),
      maskedEmail,
      "deleted_at=",
      u.deletedAt?.toISOString(),
    );
  }

  // Last-chance SiwA revocation (5.1.1(v)): tokens the soft-delete pass
  // failed to revoke get one retry before the cascade wipes the rows.
  const appleLinks = await db
    .select({ token: linkedProviders.appleRefreshToken })
    .from(linkedProviders)
    .where(
      and(
        inArray(linkedProviders.userId, candidates.map((u: { id: string }) => u.id)),
        eq(linkedProviders.provider, "apple"),
        isNotNull(linkedProviders.appleRefreshToken),
      ),
    );
  for (const link of appleLinks) {
    await revokeAppleRefreshToken(link.token!);
  }

  const result = await db
    .delete(users)
    .where(and(isNotNull(users.deletedAt), lt(users.deletedAt, cutoff)));

  return NextResponse.json({
    ok: true,
    cutoff: cutoff.toISOString(),
    deleted: candidates.length,
    rowsAffected: (result as unknown as { rowsAffected?: number }).rowsAffected ?? null,
    ran_at: now.toISOString(),
  });
}
