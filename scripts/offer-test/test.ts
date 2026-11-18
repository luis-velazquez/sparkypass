/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
// End-to-end test of the offer job (lib/offer) on a throwaway local database,
// with Resend and Expo push replaced by recorders (mocks.ts). Nothing is sent.
//   node scripts/offer-test/run.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.RESEND_API_KEY = "re_test";
process.env.EMAIL_FROM = "SparkyPass <hello@sparkypass.com>";
process.env.MAILING_ADDRESS = "PO Box 123, Dallas, TX 75201";
process.env.NEXTAUTH_SECRET = "test-secret";
const dbFile = path.join(os.tmpdir(), `sparkypass-offer-test-${process.pid}.db`);

process.env.TURSO_DATABASE_URL = "file:" + dbFile;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createClient } = require("@libsql/client");
if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
const client = createClient({ url: "file:" + dbFile });
let created = false;
// A tiny sync-looking facade over libsql for the seeding code below.
const q = async (sql: string, args: any[] = []) => (await client.execute({ sql, args })).rows as any[];
const T = (iso: string) => Math.floor(new Date(iso).getTime() / 1000);

async function freshDb(cap?: number) {
  if (created) {
    for (const t of ["users", "user_progress", "watts_transactions", "offer_codes", "offer_messages"]) await q(`DELETE FROM ${t}`);
  } else {
  created = true;
  await client.executeMultiple(`
    CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, timezone TEXT,
      created_at INTEGER NOT NULL, updated_at INTEGER, trial_ends_at INTEGER, subscription_status TEXT,
      subscription_source TEXT, subscription_period_end INTEGER, deleted_at INTEGER,
      notification_prefs TEXT NOT NULL DEFAULT '{}');
    CREATE TABLE user_progress (id TEXT PRIMARY KEY, user_id TEXT, question_id TEXT, is_correct INTEGER, answered_at INTEGER);
    CREATE TABLE watts_transactions (id TEXT PRIMARY KEY, user_id TEXT, amount INTEGER, created_at INTEGER);
  `);
  await client.executeMultiple(fs.readFileSync(path.join(process.env.OFFER_TEST_ROOT!, "drizzle/0030_offer_codes.sql"), "utf8"));
  }
  const stmt = (sql: string) => ({ run: (...args: any[]) => pending.push(q(sql, args)) });
  const pending: Promise<any>[] = [];
  const u = stmt(`INSERT INTO users (id,name,email,timezone,created_at,trial_ends_at,subscription_status,subscription_source,deleted_at,notification_prefs)
    VALUES (?,?,?,?,?,?,?,?,?,?)`);
  const tz = "America/Chicago";
  u.run("u_day6", "Ana Lopez", "day6@x.test", tz, T("2026-11-15T20:00Z"), T("2026-11-22T20:00Z"), "trialing", "trial", null, "{}");
  u.run("u_day6mon", "Bo", "day6mon@x.test", tz, T("2026-11-16T20:00Z"), T("2026-11-23T20:00Z"), "trialing", "trial", null, "{}");
  u.run("u_day6far", "Cy", "day6far@x.test", tz, T("2026-11-17T20:00Z"), T("2026-11-24T20:00Z"), "trialing", "trial", null, "{}");
  u.run("u_d15A", "Dee Ray", "a@x.test", tz, T("2026-11-06T16:00Z"), T("2026-11-13T16:00Z"), "trialing", "trial", null, '{"weeklyDigest":{"enabled":true}}');
  u.run("u_d15B", "", "b@x.test", tz, T("2026-11-04T16:00Z"), T("2026-11-11T16:00Z"), "expired", "trial", null, "{}");
  u.run("u_backlog", "Old Timer", "old@x.test", tz, T("2026-09-13T16:00Z"), T("2026-09-20T16:00Z"), "expired", null, null, "{}");
  u.run("u_unsub", "Un Sub", "unsub@x.test", tz, T("2026-11-05T16:00Z"), T("2026-11-12T16:00Z"), "expired", "trial", null, '{"offerEmails":{"enabled":false}}');
  u.run("u_apple", "Paid Once", "apple@x.test", tz, T("2026-10-20T16:00Z"), T("2026-11-01T16:00Z"), "expired", "apple", null, "{}");
  u.run("u_comp", "Comp", "comp@x.test", tz, T("2026-10-20T16:00Z"), T("2026-10-27T16:00Z"), "active", "trial", null, "{}");
  u.run("u_web", "Web Only", "web@x.test", null, T("2026-08-20T16:00Z"), T("2026-08-27T16:00Z"), "expired", "trial", null, "{}");
  u.run("u_d19", "Nineteen", "d19@x.test", tz, T("2026-10-29T16:00Z"), T("2026-11-05T16:00Z"), "expired", "trial", null, "{}");
  u.run("u_deleted", "Gone", "gone@x.test", tz, T("2026-11-03T16:00Z"), T("2026-11-10T16:00Z"), "expired", "trial", T("2026-11-15T00:00Z"), "{}");
  u.run("u_recent", "Recent", "recent@x.test", tz, T("2026-11-11T16:00Z"), T("2026-11-18T16:00Z"), "trialing", "trial", null, "{}");
  u.run("u_nofw", "No Week", "nofw@x.test", tz, T("2026-10-30T16:00Z"), null, null, null, null, "{}");
  const p = stmt("INSERT INTO user_progress VALUES (?,?,?,?,?)");
  for (let i = 0; i < 25; i++) p.run(`pa${i}`, "u_d15A", "q", 1, T("2026-11-08T12:00Z"));
  p.run("pa_late", "u_d15A", "q", 1, T("2026-11-15T12:00Z")); // after the free week: not counted
  p.run("pb1", "u_d15B", "q", 1, T("2026-11-05T12:00Z"));
  p.run("pb2", "u_d15B", "q", 0, T("2026-11-06T12:00Z"));
  for (let i = 0; i < 4; i++) p.run(`p6${i}`, "u_day6", "q", 1, T("2026-11-18T12:00Z"));
  const w = stmt("INSERT INTO watts_transactions VALUES (?,?,?,?)");
  w.run("w1", "u_d15A", 500, T("2026-11-08T12:00Z"));
  w.run("w2", "u_d15A", -100, T("2026-11-09T12:00Z"));
  w.run("w3", "u_day6", 120, T("2026-11-18T12:00Z"));
  const c = stmt("INSERT INTO offer_codes (code,batch,expires_at,user_id,given_at,imported_at) VALUES (?,?,?,?,?,?)");
  const exp = T("2027-02-01T00:00Z");
  c.run("CODEAAAA01", "2026-11", exp, null, null, T("2026-11-01T00:00Z"));
  c.run("CODEAAAA02", "2026-11", exp, null, null, T("2026-11-01T00:00Z"));
  c.run("CODEAAAA03", "2026-11", exp, null, null, T("2026-11-01T00:00Z"));
  c.run("CODEAAAA04", "2026-11", exp, null, null, T("2026-11-01T00:00Z"));
  c.run("CODEAAAA05", "2026-11", exp, null, null, T("2026-11-01T00:00Z"));
  c.run("CODESOON01", "2026-10", T("2026-11-30T00:00Z"), null, null, T("2026-10-01T00:00Z")); // too close to expiry
  c.run("CODEGIVEN19", "2026-11", exp, "u_d19", T("2026-11-17T15:00Z"), T("2026-11-01T00:00Z"));
  stmt("INSERT INTO offer_messages (id,user_id,message,version,code,sent_at) VALUES (?,?,?,?,?,?)")
    .run("m19", "u_d19", "day15_email", "B", "CODEGIVEN19", T("2026-11-17T15:00Z"));
  await Promise.all(pending);
  if (cap !== undefined) process.env.OFFER_DAILY_CAP = String(cap);
  else delete process.env.OFFER_DAILY_CAP;
}


async function main() {
  const { runOfferJob } = await import("@/lib/offer/run");
  const { activeOffer } = await import("@/lib/offer/codes");
  const { verifyUnsubscribeToken, setOfferEmailsOff, unsubscribeToken } = await import("@/lib/offer/unsubscribe");
  const sch = await import("@/lib/offer/schedule");
  const mocks = await import("./mocks");
  const sat = new Date("2026-11-21T15:00:00Z");

  // ── schedule unit checks ──
  const tz = "America/Chicago";
  assert.equal(sch.localDay(sat, tz).weekday, 6);
  assert.equal(sch.day6Due(sat, new Date("2026-11-22T20:00Z"), tz), "tomorrow");
  assert.equal(sch.day6Due(sat, new Date("2026-11-23T20:00Z"), tz), "monday");
  assert.equal(sch.day6Due(new Date("2026-11-20T15:00Z"), new Date("2026-11-23T20:00Z"), tz), null); // Friday, Monday end: Saturday sends it
  assert.equal(sch.day6Due(new Date("2026-11-22T15:00Z"), new Date("2026-11-23T20:00Z"), tz), null); // Sunday: never
  // Late-night end: free week ends 00:30 Chicago Tuesday → Monday morning says tomorrow
  assert.equal(sch.day6Due(new Date("2026-11-23T15:00Z"), new Date("2026-11-24T06:30Z"), tz), "tomorrow");
  assert.equal(sch.day15Due(sat, new Date("2026-11-13T16:00Z"), tz), true);
  assert.equal(sch.day15Due(sat, new Date("2026-11-14T16:00Z"), tz), false);
  assert.equal(sch.day15Due(new Date("2026-11-22T15:00Z"), new Date("2026-11-01T16:00Z"), tz), false); // Sunday
  assert.equal(sch.day19Due(sat, new Date("2026-11-17T15:00Z"), tz), 3);
  assert.equal(sch.day19Due(sat, new Date("2026-11-18T15:00Z"), tz), null); // only 3 days in
  assert.equal(sch.day19Due(new Date("2026-11-23T15:00Z"), new Date("2026-11-17T15:00Z"), tz), 1); // Sunday pushed to Monday: 1 day left
  assert.equal(sch.day19Due(new Date("2026-11-24T16:00Z"), new Date("2026-11-17T15:00Z"), tz), null); // past use-by
  // Tokyo: Saturday 15:00 UTC is Sunday 00:00 there → skipped
  assert.equal(sch.isLocalSunday(sat, "Asia/Tokyo"), true);
  assert.equal(sch.localDay(sat, "Not/AZone").weekday, 6); // bad zone falls back to Chicago
  console.log("✓ schedule rules");

  // ── test mode writes nothing ──
  await freshDb();
  const t = await runOfferJob({ live: false, now: sat });
  assert.equal(t.mode, "test");
  assert.deepEqual([t.day6.due, t.day19.due, t.day15.due], [2, 1, 4]);
  assert.deepEqual(t.day15.ids, ["u_d15A", "u_d15B", "u_nofw", "u_backlog"]);
  assert.equal(t.day15.versionA, 1);
  assert.equal(t.day15.versionB, 3);
  assert.equal(mocks.sentEmails.length, 0);
  assert.equal(Number((await q("SELECT count(*) n FROM offer_messages"))[0].n), 1);
  assert.equal(Number((await q("SELECT count(*) n FROM offer_codes WHERE user_id IS NOT NULL"))[0].n), 1);
  console.log("✓ test mode: counts right, nothing sent or written", JSON.stringify({ day6: t.day6.due, day19: t.day19.due, day15: t.day15.due, A: t.day15.versionA, B: t.day15.versionB }));

  // ── live run ──
  const r = await runOfferJob({ live: true, now: sat });
  assert.equal(r.mode, "live", JSON.stringify(r.problems));
  assert.deepEqual([r.day6.sent, r.day19.sent, r.day15.sent, r.day15.codeOnly], [2, 1, 4, 1]);
  assert.equal(r.pushes.sent, 1);
  assert.equal(mocks.sentEmails.length, 7);
  const byTo = Object.fromEntries(mocks.sentEmails.map((e: any) => [e.to, e]));
  assert.match(byTo["day6@x.test"].subject, /ends tomorrow/);
  assert.match(byTo["day6@x.test"].text, /answered 4 questions and earned 120 Watts/);
  assert.match(byTo["day6@x.test"].text, /Hi Ana,/);
  assert.match(byTo["day6mon@x.test"].subject, /ends Monday/);
  assert.match(byTo["day6mon@x.test"].text, /haven't taken a quiz yet/);
  assert.match(byTo["a@x.test"].subject, /^Your first month of Pro for \$0\.99/);
  assert.match(byTo["a@x.test"].text, /answered 25 questions and earned 500 Watts/);
  assert.match(byTo["b@x.test"].subject, /^Try Pro for a month/);
  assert.match(byTo["b@x.test"].text, /^Hi there,/);
  assert.match(byTo["b@x.test"].text, /Hola:/);
  assert.match(byTo["d19@x.test"].subject, /^3 days left/);
  assert.match(byTo["d19@x.test"].text, /CODEGIVEN19/);
  assert.match(byTo["d19@x.test"].text, /good through November 24/);
  assert.match(byTo["d19@x.test"].text, /hasta el 24 de noviembre/);
  for (const e of mocks.sentEmails as any[]) {
    assert.equal(e.from, "Luis at SparkyPass <hello@sparkypass.com>");
    assert.equal(e.replyTo, "support@sparkypass.com");
    assert.equal(e.headers["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
    assert.match(e.headers["List-Unsubscribe"], /^<https:\/\/sparkypass\.com\/api\/email\/unsubscribe\?u=u_[a-z0-9A-Z_]+&t=[\w-]{32}>$/);
    assert.match(e.text, /PO Box 123, Dallas, TX 75201/);
    assert.match(e.html, /sparkypass\.com\/unsubscribe\?u=/);
    assert.match(e.idempotencyKey, /^offer\/u_\w+\/day(6|15|19)_email$/);
  }
  for (const who of ["comp@x.test", "apple@x.test", "web@x.test", "gone@x.test", "recent@x.test", "unsub@x.test", "day6far@x.test"]) {
    assert.ok(!byTo[who], `${who} must not get an email`);
  }
  const push = mocks.sentPushes[0];
  assert.deepEqual(push.data, { type: "offer", route: "/paywall" });
  assert.match(push.title, /\$0\.99/);
  const codes = await q("SELECT code, user_id FROM offer_codes ORDER BY code");
  const given = Object.fromEntries(codes.filter((c: any) => c.user_id).map((c: any) => [c.user_id, c.code]));
  assert.ok(given.u_d15A && given.u_d15B && given.u_nofw && given.u_backlog && given.u_unsub);
  assert.equal(codes.find((c: any) => c.code === "CODESOON01").user_id, null, "near-expiry code never given");
  assert.match(byTo["a@x.test"].text, new RegExp(given.u_d15A));
  assert.match(byTo["a@x.test"].text, new RegExp(`apps\\.apple\\.com/redeem\\?ctx=offercodes&id=6801112841&code=${given.u_d15A}`));
  const msgs = await q("SELECT user_id, message, version, provider_id FROM offer_messages ORDER BY user_id, message");
  assert.equal(msgs.filter((m: any) => m.message === "day15_email").length, 5); // 4 new + u_d19's old one
  assert.equal(msgs.find((m: any) => m.user_id === "u_d15A" && m.message === "day15_email").version, "A");
  assert.ok(msgs.find((m: any) => m.user_id === "u_d15A" && m.message === "day15_push"));
  assert.ok(msgs.filter((m: any) => m.message !== "day15_push" && !(m.user_id === "u_d19" && m.message === "day15_email")).every((m: any) => m.provider_id));
  assert.ok(r.warnings.some((w) => /Only 0 offer codes left/.test(w)), JSON.stringify(r.warnings));
  console.log("✓ live run: 7 emails, 1 push, 5 codes; skips Pro, comps, past payers, web-only, deleted, unsubscribed, not-yet-due");

  // ── running again the same day sends nothing new ──
  const again = await runOfferJob({ live: true, now: sat });
  assert.equal(mocks.sentEmails.length, 7);
  assert.deepEqual([again.day6.sent, again.day19.sent, again.day15.sent], [0, 0, 0]);
  console.log("✓ second run sends nothing twice");

  // ── profile offer ──
  const offer = await activeOffer("u_d15A", false, sat);
  assert.equal(offer?.code, given.u_d15A);
  assert.equal(offer?.useBy, "2026-11-28T15:00:00.000Z");
  assert.equal(offer?.priceText, "$0.99");
  assert.equal(await activeOffer("u_d15A", true, sat), null);
  assert.equal(await activeOffer("u_d15A", false, new Date("2026-11-28T15:00:01Z")), null);
  assert.equal(await activeOffer("u_day6", false, sat), null);
  console.log("✓ profile offer: shown before use-by, hidden for Pro and after use-by");

  // ── unsubscribe ──
  assert.ok(verifyUnsubscribeToken("u_d15A", unsubscribeToken("u_d15A")));
  assert.ok(!verifyUnsubscribeToken("u_d15B", unsubscribeToken("u_d15A")));
  assert.ok(!verifyUnsubscribeToken("u_d15A", "x".repeat(32)));
  await setOfferEmailsOff("u_d15A");
  const prefs = JSON.parse((await q("SELECT notification_prefs p FROM users WHERE id='u_d15A'"))[0].p);
  assert.equal(prefs.weeklyDigest.enabled, true);
  assert.equal(prefs.offerEmails.enabled, false);
  console.log("✓ unsubscribe: signed per user, keeps other settings");

  // ── daily cap ──
  mocks.sentEmails.length = 0;
  await freshDb(3);
  const capped = await runOfferJob({ live: true, now: sat });
  assert.deepEqual([capped.day6.sent, capped.day19.sent, capped.day15.sent], [2, 1, 0]);
  assert.equal(capped.day15.waitingForCap, 4);
  assert.equal(capped.day15.codeOnly, 1);
  const monday = new Date("2026-11-23T15:00:00Z");
  const next = await runOfferJob({ live: true, now: monday });
  // Monday: u_day6far's week ends Tuesday, so its email 1 takes a slot first.
  assert.equal(next.day6.sent, 1);
  assert.deepEqual(next.day15.ids, ["u_d15A", "u_d15B"]);
  assert.equal(next.day15.sent, 2);
  assert.equal(next.day15.waitingForCap, 2);
  console.log("✓ daily cap: time-sensitive emails first, backlog waits, newest first next day");

  // ── a failed send gives the code back ──
  mocks.sentEmails.length = 0;
  await freshDb();
  (globalThis as any).__failFor = "b@x.test";
  const failed = await runOfferJob({ live: true, now: sat });
  assert.equal(failed.failures, 1);
  assert.equal(Number((await q("SELECT count(*) n FROM offer_codes WHERE user_id='u_d15B'"))[0].n), 0);
  assert.equal(Number((await q("SELECT count(*) n FROM offer_messages WHERE user_id='u_d15B'"))[0].n), 0);
  (globalThis as any).__failFor = undefined;
  const retry = await runOfferJob({ live: true, now: new Date("2026-11-23T15:00:00Z") });
  assert.deepEqual(retry.day15.ids, ["u_d15B"]);
  assert.equal(retry.day15.sent, 1);
  console.log("✓ failed send: code back in the pool, retried next run");

  // ── live without the mailing address refuses ──
  delete process.env.MAILING_ADDRESS;
  await freshDb();
  const blocked = await runOfferJob({ live: true, now: sat });
  assert.equal(blocked.mode, "test");
  assert.ok(blocked.problems.some((p) => /MAILING_ADDRESS/.test(p)));
  console.log("✓ live mode refuses without a mailing address");
  console.log("\nALL PASSED");
  fs.rmSync(dbFile, { force: true });
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
