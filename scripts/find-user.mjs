#!/usr/bin/env node
/**
 * Read-only account lookup in the production SparkyPass database.
 *
 *   node scripts/find-user.mjs <email | name fragment>
 *
 * Matches email exactly (case-insensitive) or name/email containing the text.
 * Prints id, name, email, provider, subscription state, trial end, created.
 * Never prints password hashes or codes. Needs TURSO_* in .env.local.
 */
import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const q = process.argv.slice(2).join(" ").trim();
if (!q) { console.error("usage: node scripts/find-user.mjs <email | name fragment>"); process.exit(1); }

const env = Object.fromEntries(
  readFileSync(join(ROOT, ".env.local"), "utf8").split("\n").filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")]; }),
);
const db = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN });
const ts = (v) => (v == null ? null : new Date(Number(v) * 1000).toISOString().slice(0, 10));

const sql = `SELECT id, name, email, auth_provider, subscription_status, subscription_source, trial_ends_at, deleted_at, created_at
             FROM users WHERE lower(email) = ? OR lower(email) LIKE ? OR lower(name) LIKE ?
             ORDER BY created_at DESC LIMIT 10`;
const like = `%${q.toLowerCase()}%`;
const r = await db.execute({ sql, args: [q.toLowerCase(), like, like] });
if (!r.rows.length) { console.log(`No account matches "${q}".`); process.exit(0); }
for (const u of r.rows) {
  const status = u.deleted_at ? "DELETED" : (u.subscription_status ?? "none");
  console.log(`${String(u.id).slice(0, 8)}…  ${u.name}  <${u.email}>  provider=${u.auth_provider}  status=${status}  source=${u.subscription_source ?? "none"}  trial_ends=${ts(u.trial_ends_at) ?? "-"}  created=${ts(u.created_at)}`);
}
