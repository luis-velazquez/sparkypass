#!/usr/bin/env node
/**
 * Read-only report on the $0.99 first-month offer (plan E-12). Prints numbers
 * only: no names, emails or codes.
 *
 *   node scripts/offer-report.mjs
 *
 * What it shows
 *   1. Messages sent, by email and by version (2A studied / 2B barely tried).
 *   2. For people given a code: how many went Pro through Apple afterwards,
 *      and how many are still paying after the first month (the number that
 *      decides whether $0.99 pays: the first month brings in about $0.84 after
 *      Apple's cut, each later month about $12.74).
 *   3. Unsubscribes from offer emails.
 *   4. The guard: of the people whose free week ended in the 4 weeks before
 *      the first offer email vs the 4 weeks after, the share who paid full
 *      price without a code. A drop after launch would mean people wait for
 *      the deal.
 *
 * "Went Pro" is read from the account (RevenueCat's webhook marks Apple
 * subscribers), so it can include someone who paid full price after getting a
 * code. App Store Connect → Subscriptions → Offer Codes shows the exact
 * number of codes redeemed.
 *
 * Needs TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env.local (this repo's,
 * or ~/Projects/sparkypass/.env.local).
 */
import { createClient } from "@libsql/client";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// OFFER_SCRIPT_DB_URL=file:/path/test.db points the script at a local test
// database instead of production (used to test the script itself).
const testDb = process.env.OFFER_SCRIPT_DB_URL;
const envPath = testDb ? null : [join(ROOT, ".env.local"), join(homedir(), "Projects/sparkypass/.env.local")].find((p) => existsSync(p));
if (!testDb && !envPath) {
  console.error("✗ No .env.local found");
  process.exit(1);
}
const env = testDb ? { TURSO_DATABASE_URL: testDb } : Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")];
    }),
);
if (testDb) console.log(`(test database: ${testDb})`);
const db = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN });

const now = Math.floor(Date.now() / 1000);
const DAY = 86400;
const show = async (label, sql, args = []) => {
  const r = await db.execute({ sql, args });
  console.log(`\n${label}`);
  console.table(r.rows.map((row) => ({ ...row })));
  return r.rows;
};

const first = await db.execute("SELECT min(sent_at) AS t FROM offer_messages WHERE message = 'day15_email'");
const launch = first.rows[0]?.t;
if (!launch) {
  console.log("No offer emails have been sent yet.");
  process.exit(0);
}
console.log(`First offer email: ${new Date(Number(launch) * 1000).toISOString().slice(0, 10)}`);

await show(
  "1. Messages sent",
  `SELECT message, coalesce(version, '') AS version, count(*) AS sent
     FROM offer_messages GROUP BY 1, 2 ORDER BY 1, 2`,
);

const paid = `u.subscription_source = 'apple'`;
const stillPaying = `u.subscription_source = 'apple' AND u.subscription_status IN ('active', 'past_due')
                     AND u.subscription_period_end > c.given_at + 35 * ${DAY}`;
await show(
  "2. People given a code, by email 2 version (A = studied 20+, B = fewer, none = unsubscribed, code on the paywall only)",
  `SELECT coalesce(m.version, 'none') AS version,
          count(*) AS given,
          sum(CASE WHEN ${paid} THEN 1 ELSE 0 END) AS went_pro,
          sum(CASE WHEN ${stillPaying} THEN 1 ELSE 0 END) AS paying_after_month_1,
          sum(CASE WHEN c.given_at <= ${now} - 35 * ${DAY} THEN 1 ELSE 0 END) AS given_35_plus_days_ago
     FROM offer_codes c
     JOIN users u ON u.id = c.user_id
     LEFT JOIN offer_messages m ON m.user_id = c.user_id AND m.message = 'day15_email'
    WHERE c.user_id IS NOT NULL
    GROUP BY 1 ORDER BY 1`,
);
console.log("  paying_after_month_1 only means something for codes given 35+ days ago (last column).");

await show(
  "3. Unsubscribed from offer emails",
  `SELECT count(*) AS unsubscribed FROM users
    WHERE json_extract(notification_prefs, '$.offerEmails.enabled') = 0`,
);

await show(
  "Code pool",
  `SELECT batch, date(expires_at, 'unixepoch') AS expires,
          sum(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END) AS unused,
          sum(CASE WHEN user_id IS NOT NULL THEN 1 ELSE 0 END) AS given
     FROM offer_codes GROUP BY 1, 2 ORDER BY 2`,
);

// 4. The guard. Free-week end = trial_ends_at, or sign-up + 7 days when unset.
const weekEnd = `coalesce(u.trial_ends_at, u.created_at + 7 * ${DAY})`;
const rows = await show(
  "4. The guard: paid full price without a code, by when the free week ended",
  `SELECT CASE WHEN ${weekEnd} < ? THEN 'a. 4 weeks before launch' ELSE 'b. 4 weeks after launch' END AS window,
          count(*) AS free_weeks_ended,
          sum(CASE WHEN ${paid} AND c.code IS NULL THEN 1 ELSE 0 END) AS paid_full_price,
          round(100.0 * sum(CASE WHEN ${paid} AND c.code IS NULL THEN 1 ELSE 0 END) / count(*), 1) AS pct
     FROM users u
     LEFT JOIN offer_codes c ON c.user_id = u.id
    WHERE u.deleted_at IS NULL AND u.timezone IS NOT NULL
      AND ${weekEnd} >= ? AND ${weekEnd} < ?
      AND (u.subscription_source IS NULL OR u.subscription_source IN ('trial', 'apple'))
      AND NOT (u.subscription_status = 'active' AND u.subscription_source = 'trial')
    GROUP BY 1 ORDER BY 1`,
  [launch, Number(launch) - 28 * DAY, Math.min(Number(launch) + 28 * DAY, now - 8 * DAY)],
);
if (rows.length < 2) {
  console.log("  The after-launch window fills in once free weeks that ended after launch are 8+ days old.");
}
console.log("  Comps (Pro through a free grant) are left out of the guard.");
