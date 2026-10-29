#!/usr/bin/env node
/**
 * Comp a SparkyPass user free Pro time through RevenueCat.
 *
 *   node scripts/comp-user.mjs <email> [--months 1 | --days N] [--dry-run]
 *   node scripts/comp-user.mjs <email> --revoke
 *
 * How it works
 *   1. Looks the user up in the production database by email (the app logs the
 *      RevenueCat customer in with the SparkyPass user id, so user id == RC customer id).
 *   2. Refuses to touch anyone who is currently paying through Apple.
 *   3. Confirms the customer exists in RevenueCat (they must have opened the app once).
 *   4. Grants the `pro` entitlement via the REST API v2 until the computed expiry.
 *      RevenueCat then fires a PROMOTIONAL webhook which the API mirrors into
 *      users.subscription_status, and the app's RevenueCat SDK reports Pro directly.
 *
 * Needs in ~/Projects/sparkypass/.env.local:
 *   TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, REVENUECAT_SECRET_API_KEY (a V2 secret
 *   key with "Customer information: read and write").
 * Optional (skips two lookups): REVENUECAT_PROJECT_ID, REVENUECAT_PRO_ENTITLEMENT_ID
 */
import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RC = "https://api.revenuecat.com/v2";
const ENTITLEMENT_LOOKUP_KEY = "pro";

// ---------- args ----------
const args = process.argv.slice(2);
const email = args.find((a) => !a.startsWith("--"))?.trim().toLowerCase();
const flag = (name) => args.includes(`--${name}`);
const value = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback;
};
const dryRun = flag("dry-run");
const revoke = flag("revoke");
const months = Number(value("months", revoke ? 0 : 1));
const days = Number(value("days", 0));
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) die("usage: node scripts/comp-user.mjs <email> [--months 1 | --days N] [--dry-run | --revoke]");
if (!revoke && months <= 0 && days <= 0) die("give --months N or --days N");

// ---------- env ----------
const env = Object.fromEntries(
  readFileSync(join(ROOT, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")]; }),
);
for (const k of ["TURSO_DATABASE_URL", "TURSO_AUTH_TOKEN", "REVENUECAT_SECRET_API_KEY"]) if (!env[k]) die(`${k} missing from .env.local`);

// ---------- 1. database lookup ----------
const db = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN });
const found = await db.execute({
  sql: "SELECT id, name, email, auth_provider, subscription_status, subscription_source, trial_ends_at, deleted_at FROM users WHERE lower(email)=?",
  args: [email],
});
if (!found.rows.length) die(`No SparkyPass account for ${email}. They need to sign up in the app first (Apple "Hide My Email" users have a relay address on file; search by name instead).`);
const user = found.rows[0];
if (user.deleted_at) die(`${email} is a deleted account (pending purge). Not comping.`);
console.log(`Account: ${user.name} <${user.email}>  id=${user.id}  provider=${user.auth_provider}  status=${user.subscription_status ?? "none"}  source=${user.subscription_source ?? "none"}`);
if (!revoke && (user.subscription_status === "active" || user.subscription_status === "past_due") && user.subscription_source === "apple") {
  die("This user is currently paying through Apple. A comp would be overwritten by RevenueCat; nothing to do.");
}

// ---------- 2. RevenueCat identifiers ----------
const rc = async (path, init = {}) => {
  const res = await fetch(`${RC}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${env.REVENUECAT_SECRET_API_KEY}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const text = await res.text();
  let body; try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body };
};

// Project ID from RevenueCat → Project settings → General ("Used in our REST API v2 endpoints").
let projectId = env.REVENUECAT_PROJECT_ID || "proj3bd1c528";
if (!projectId) {
  const r = await rc("/projects");
  if (r.status !== 200) die(`GET /projects failed (${r.status}): ${JSON.stringify(r.body)}`);
  const projects = r.body.items ?? [];
  if (projects.length !== 1) die(`Expected one RevenueCat project, found ${projects.length}: ${projects.map((p) => `${p.name} (${p.id})`).join(", ")}. Set REVENUECAT_PROJECT_ID in .env.local.`);
  projectId = projects[0].id;
}
// "pro" entitlement object id (verified via the API on 2026-10-28); override with REVENUECAT_PRO_ENTITLEMENT_ID if it ever changes.
let entitlementId = env.REVENUECAT_PRO_ENTITLEMENT_ID || "entlf84aeda57c";
if (!entitlementId) {
  const r = await rc(`/projects/${projectId}/entitlements`);
  if (r.status !== 200) die(`GET entitlements failed (${r.status}): ${JSON.stringify(r.body)}`);
  const ent = (r.body.items ?? []).find((e) => e.lookup_key === ENTITLEMENT_LOOKUP_KEY);
  if (!ent) die(`No entitlement with lookup key "${ENTITLEMENT_LOOKUP_KEY}" in project ${projectId}. Found: ${(r.body.items ?? []).map((e) => e.lookup_key).join(", ")}`);
  entitlementId = ent.id;
}
console.log(`RevenueCat: project=${projectId}  entitlement(${ENTITLEMENT_LOOKUP_KEY})=${entitlementId}`);

// ---------- 3. customer must exist (they opened the app at least once) ----------
const customerId = String(user.id);
const cust = await rc(`/projects/${projectId}/customers/${encodeURIComponent(customerId)}`);
if (cust.status === 404) die(`RevenueCat has no customer ${customerId} yet. Ask them to open the app and sign in once, then run this again.`);
if (cust.status !== 200) die(`GET customer failed (${cust.status}): ${JSON.stringify(cust.body)}`);
const activeEnts = cust.body.active_entitlements?.items ?? cust.body.active_entitlements ?? [];
console.log(`RevenueCat customer found. Active entitlements now: ${activeEnts.length ? JSON.stringify(activeEnts) : "none"}`);

// ---------- 4. grant / revoke ----------
if (revoke) {
  if (dryRun) { console.log("DRY RUN: would revoke the granted entitlement."); process.exit(0); }
  const r = await rc(`/projects/${projectId}/customers/${encodeURIComponent(customerId)}/actions/revoke_granted_entitlement`, {
    method: "POST", body: JSON.stringify({ entitlement_id: entitlementId }),
  });
  if (r.status >= 300) die(`revoke failed (${r.status}): ${JSON.stringify(r.body)}`);
  console.log("Revoked. The RevenueCat webhook will update the app within seconds.");
  process.exit(0);
}

const expires = new Date();
if (months) expires.setMonth(expires.getMonth() + months);
if (days) expires.setDate(expires.getDate() + days);
console.log(`Grant: ${ENTITLEMENT_LOOKUP_KEY} until ${expires.toISOString()} (${months ? `${months} month(s)` : ""}${days ? ` ${days} day(s)` : ""})`);
if (dryRun) { console.log("DRY RUN: nothing granted."); process.exit(0); }

const grant = await rc(`/projects/${projectId}/customers/${encodeURIComponent(customerId)}/actions/grant_entitlement`, {
  method: "POST",
  body: JSON.stringify({ entitlement_id: entitlementId, expires_at: expires.getTime() }),
});
if (grant.status >= 300) die(`grant failed (${grant.status}): ${JSON.stringify(grant.body)}`);
console.log(`Granted. RevenueCat response ${grant.status}. The user is Pro on next app launch; the webhook mirrors it to the database.`);

function die(msg) { console.error("✖ " + msg); process.exit(1); }
