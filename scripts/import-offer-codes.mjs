#!/usr/bin/env node
/**
 * Import one-time App Store offer codes into the offer_codes pool
 * (the $0.99 first month; HQ Plan/sparkypass-offer-emails-plan.md).
 *
 *   node scripts/import-offer-codes.mjs <codes file> --batch 2026-11 --expires 2027-02-01
 *   node scripts/import-offer-codes.mjs <codes file> --batch 2026-11 --expires 2027-02-01 --apply
 *
 * The file is the one App Store Connect lets you download after generating
 * one-time-use codes: one code per line (a CSV works too; the first column is
 * read, and header lines are skipped). Without --apply it only reads the file
 * and says what it would import. Codes already in the pool are left alone, so
 * running it twice is safe.
 *
 * --expires is the batch's expiration date as set in App Store Connect. The
 * job only gives out codes with at least 14 days left.
 *
 * Needs TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env.local (this repo's,
 * or ~/Projects/sparkypass/.env.local). Migration 0030 must be applied first.
 * Never prints the codes themselves.
 */
import { createClient } from "@libsql/client";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const die = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};

const args = process.argv.slice(2);
const value = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : null;
};
const valueSlots = new Set(["--batch", "--expires"].map((f) => args.indexOf(f) + 1).filter((i) => i > 0));
const file = args.find((a, i) => !a.startsWith("--") && !valueSlots.has(i));
const batch = value("batch");
const expiresRaw = value("expires");
const apply = args.includes("--apply");

if (!file) die("Usage: node scripts/import-offer-codes.mjs <codes file> --batch 2026-11 --expires 2027-02-01 [--apply]");
if (!batch) die("--batch is required (for example 2026-11)");
if (!expiresRaw || !/^\d{4}-\d{2}-\d{2}$/.test(expiresRaw)) die("--expires YYYY-MM-DD is required");
const expires = new Date(`${expiresRaw}T23:59:59Z`);
if (expires.getTime() <= Date.now()) die("--expires is in the past");
if (!existsSync(file)) die(`File not found: ${file}`);

const codes = new Set();
let skipped = 0;
for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
  const cell = line.split(",")[0].trim().replace(/^"|"$/g, "").toUpperCase();
  if (!cell) continue;
  if (/^[A-Z0-9]{6,64}$/.test(cell)) codes.add(cell);
  else skipped++;
}
if (codes.size === 0) die("No codes found in the file.");

// OFFER_SCRIPT_DB_URL=file:/path/test.db points the script at a local test
// database instead of production (used to test the script itself).
const testDb = process.env.OFFER_SCRIPT_DB_URL;
const envPath = testDb ? null : [join(ROOT, ".env.local"), join(homedir(), "Projects/sparkypass/.env.local")].find((p) => existsSync(p));
if (!testDb && !envPath) die("No .env.local found");
const env = testDb ? { TURSO_DATABASE_URL: testDb, TURSO_AUTH_TOKEN: "local" } : Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")];
    }),
);
for (const k of ["TURSO_DATABASE_URL", "TURSO_AUTH_TOKEN"]) if (!env[k]) die(`${k} missing from ${envPath}`);
if (testDb) console.log(`(test database: ${testDb})`);
const db = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN });

const table = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='offer_codes'");
if (table.rows.length === 0) die("The offer_codes table doesn't exist yet. Apply migration 0030 first.");

console.log(`File: ${codes.size} codes (${skipped} other lines skipped). Batch ${batch}, expires ${expiresRaw}.`);
if (!apply) {
  console.log("Nothing written. Add --apply to import them.");
  process.exit(0);
}

const now = Math.floor(Date.now() / 1000);
const exp = Math.floor(expires.getTime() / 1000);
const list = [...codes];
let inserted = 0;
for (let i = 0; i < list.length; i += 200) {
  const chunk = list.slice(i, i + 200);
  const res = await db.batch(
    chunk.map((code) => ({
      sql: "INSERT OR IGNORE INTO offer_codes (code, batch, expires_at, imported_at) VALUES (?, ?, ?, ?)",
      args: [code, batch, exp, now],
    })),
    "write",
  );
  inserted += res.reduce((n, r) => n + r.rowsAffected, 0);
}
const pool = await db.execute({
  sql: "SELECT count(*) AS n FROM offer_codes WHERE user_id IS NULL AND expires_at > ?",
  args: [now + 14 * 86400],
});
console.log(`✓ Imported ${inserted} new codes (${list.length - inserted} were already in the pool).`);
console.log(`  Codes ready to give out: ${pool.rows[0].n}`);
