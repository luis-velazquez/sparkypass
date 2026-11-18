#!/usr/bin/env node
/**
 * Apply one hand-written migration file to the production database.
 *
 *   node scripts/apply-migration.mjs drizzle/0030_offer_codes.sql            (shows the statements)
 *   node scripts/apply-migration.mjs drizzle/0030_offer_codes.sql --apply    (runs them)
 *
 * Meant for files written to be safe to run twice (CREATE … IF NOT EXISTS).
 * An ALTER TABLE ADD COLUMN that already ran reports "duplicate column" and is
 * skipped. Afterwards it prints the columns of every table the file creates
 * or alters, so you can see it landed.
 *
 * Needs TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env.local (this repo's,
 * or ~/Projects/sparkypass/.env.local).
 */
import { createClient } from "@libsql/client";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const die = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const fileArg = args.find((a) => !a.startsWith("--"));
if (!fileArg) die("Usage: node scripts/apply-migration.mjs <file.sql> [--apply]");
const file = [resolve(fileArg), join(ROOT, fileArg)].find((p) => existsSync(p));
if (!file) die(`File not found: ${fileArg}`);

// Strip comments, then split on semicolons at the end of a statement.
const statements = readFileSync(file, "utf8")
  .split("\n")
  .map((l) => l.replace(/--.*$/, ""))
  .join("\n")
  .split(/;\s*(?:\n|$)/)
  .map((s) => s.trim())
  .filter(Boolean);

const tables = new Set();
for (const s of statements) {
  const m = s.match(/(?:CREATE TABLE(?: IF NOT EXISTS)?|ALTER TABLE)\s+([a-z_]+)/i);
  if (m) tables.add(m[1]);
}

console.log(`${file}\n${statements.length} statements:`);
for (const s of statements) console.log(`  • ${s.split("\n")[0]}${s.includes("\n") ? " …" : ""}`);
if (!apply) {
  console.log("\nNothing run. Add --apply to run them on the production database.");
  process.exit(0);
}

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

for (const s of statements) {
  try {
    await db.execute(s);
    console.log(`✓ ${s.split("\n")[0]}`);
  } catch (err) {
    if (/duplicate column/i.test(String(err))) console.log(`= already applied: ${s.split("\n")[0]}`);
    else die(`${s.split("\n")[0]}\n  ${err}`);
  }
}

for (const t of tables) {
  const cols = await db.execute(`PRAGMA table_info(${t})`);
  console.log(`\n${t}: ${cols.rows.map((r) => r.name).join(", ")}`);
}
