/**
 * One-time backfill: push existing Stripe-paid users' subscription state to
 * RevenueCat. Run after configuring REVENUECAT_SECRET_API_KEY so RC's view of
 * cross-platform entitlements catches up with our database.
 *
 * Per audit OQ#1 resolution, going forward the Stripe webhook calls
 * pushSubscriberAttributes on every state change (already wired). This script
 * just primes the pre-existing users.
 *
 * Usage (against local DB):
 *   npx tsx scripts/backfill-stripe-rc.ts
 *
 * Usage (against Turso prod):
 *   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... REVENUECAT_SECRET_API_KEY=... \
 *     npx tsx scripts/backfill-stripe-rc.ts
 *
 * Safe to re-run — RC's attribute endpoint is upsert semantics. Idempotent.
 */

import { db, users } from "../lib/db";
import { isNotNull, and, isNull } from "drizzle-orm";
import { pushSubscriberAttributes } from "../lib/revenuecat";

async function main() {
  if (!process.env.REVENUECAT_SECRET_API_KEY) {
    console.error(
      "REVENUECAT_SECRET_API_KEY is not set. Aborting — the backfill would no-op.",
    );
    process.exit(1);
  }

  // Pull every user with a Stripe subscription that isn't soft-deleted. We
  // also include canceled/expired states so RC has the full picture (a user
  // who lapsed should be reflected as such in RC, not just absent).
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      subscriptionStatus: users.subscriptionStatus,
      subscriptionPeriodEnd: users.subscriptionPeriodEnd,
      stripeCustomerId: users.stripeCustomerId,
      stripeSubscriptionId: users.stripeSubscriptionId,
    })
    .from(users)
    .where(and(isNotNull(users.stripeCustomerId), isNull(users.deletedAt)));

  console.log(`Found ${rows.length} Stripe-tagged users to backfill.`);

  let ok = 0;
  let failed = 0;
  let skipped = 0;
  const failures: Array<{ id: string; email: string; error: string }> = [];

  for (const u of rows) {
    if (!u.subscriptionStatus) {
      skipped++;
      continue;
    }
    const result = await pushSubscriberAttributes(u.id, {
      subscriptionStatus: u.subscriptionStatus,
      subscriptionSource: "stripe",
      subscriptionPeriodEnd: u.subscriptionPeriodEnd ?? null,
      stripeCustomerId: u.stripeCustomerId,
      stripeSubscriptionId: u.stripeSubscriptionId,
    });
    if (result.ok) {
      ok++;
      const maskedEmail = u.email.replace(/(^.).*(@.*$)/, "$1***$2");
      console.log(`  ✓ ${u.id.slice(0, 8)} ${maskedEmail} → RC`);
    } else {
      failed++;
      const maskedEmail = u.email.replace(/(^.).*(@.*$)/, "$1***$2");
      console.error(`  ✗ ${u.id.slice(0, 8)} ${maskedEmail}: ${result.error}`);
      failures.push({ id: u.id, email: maskedEmail, error: result.error ?? "unknown" });
    }

    // Be polite to RC's rate limit — 150ms between requests = ~6 req/s.
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log("\n=== Summary ===");
  console.log(`Total candidates: ${rows.length}`);
  console.log(`Pushed:           ${ok}`);
  console.log(`Skipped:          ${skipped} (no subscriptionStatus)`);
  console.log(`Failed:           ${failed}`);

  if (failures.length > 0) {
    console.log("\nFailures (re-run after investigating these):");
    for (const f of failures) {
      console.log(`  ${f.id.slice(0, 8)} ${f.email}: ${f.error}`);
    }
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Backfill threw:", err);
  process.exit(1);
});
