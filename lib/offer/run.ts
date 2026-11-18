// The daily offer job (HQ Plan/sparkypass-offer-emails-plan.md, Phase 1).
//
// Runs Monday to Saturday (vercel.json) and does, in this order:
//   1. Email 1 to people whose free week ends tomorrow (time-sensitive).
//   2. Email 3 to people whose code's use-by date is a few days away.
//   3. Email 2 to people on or past day 15 who never paid, newest first, so
//      the backlog (E-06) drains under the daily cap without delaying the
//      people reaching day 15 today. Each gets their own one-time code, and
//      one push if they have the app's notifications on (E-09).
//
// Who never gets these: deleted accounts, web-only accounts (no time zone),
// anyone who unsubscribed (they still see their code on the paywall, but get
// no email or push), Pro users and comps (status active), and anyone who ever
// paid through Apple (E-08; Apple's win-back offers are for them).
//
// Test mode (the default until OFFER_EMAILS_ENABLED=true) does every step
// except giving codes, sending and recording, and reports what would happen.

import crypto from "crypto";
import { and, eq, gt, gte, inArray, isNotNull, isNull, lt, lte, or, sql } from "drizzle-orm";
import { Resend } from "resend";
import { db, offerCodes, offerMessages, users, userProgress, wattsTransactions } from "@/lib/db";
import type { OfferMessageValue } from "@/lib/db";
import { sendPushNotifications, tokensForUser } from "@/lib/push";
import {
  OFFER_STUDIED_THRESHOLD,
  LOW_CODE_WARNING,
  dailyCap,
  fullPriceText,
  liveSendProblems,
  mailingAddress,
  offerFrom,
  offerPriceText,
  redeemUrl,
  replyTo,
} from "./config";
import { codesLeft, giveCode, type GivenCode } from "./codes";
import { day15Push, renderDay15, renderDay19, renderDay6, type Rendered } from "./emails";
import {
  DEFAULT_TIME_ZONE,
  day15Due,
  day19Due,
  day6Due,
  freeWeekEnd,
  isLocalSunday,
  offerDeadline,
} from "./schedule";
import { offerEmailsOff, oneClickUrl, unsubscribePageUrl } from "./unsubscribe";

const DAY_MS = 24 * 60 * 60 * 1000;
const SEND_SPACING_MS = 400; // stays under Resend's per-second rate limit
const TIME_BUDGET_MS = 45_000; // the route allows 60 s; leave the rest for tomorrow
const EMAIL_MESSAGES: OfferMessageValue[] = ["day6_email", "day15_email", "day19_email"];

export interface RunResult {
  mode: "live" | "test";
  /** Why live mode can't send (test mode lists them as a heads-up). */
  problems: string[];
  cap: number;
  sentTodayBefore: number;
  day6: { due: number; sent: number; ids: string[] };
  day19: { due: number; sent: number; ids: string[] };
  day15: {
    due: number;
    sent: number;
    versionA: number;
    versionB: number;
    codeOnly: number; // unsubscribed: code on the paywall, no email
    waitingForCap: number;
    ids: string[];
  };
  pushes: { sent: number; failed: number };
  skippedUnsubscribed: number;
  skippedSunday: number;
  failures: number;
  codesLeft: number;
  warnings: string[];
  stoppedEarly: boolean;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  timezone: string | null;
  createdAt: Date;
  trialEndsAt: Date | null;
  subscriptionStatus: string | null;
  notificationPrefs: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let _resend: Resend | null = null;
function resend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

/** Answers and positive Watts between two moments (the weekly digest's tables). */
async function statsBetween(userId: string, from: Date, to: Date) {
  const [p] = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(userProgress)
    .where(
      and(
        eq(userProgress.userId, userId),
        gte(userProgress.answeredAt, from),
        lt(userProgress.answeredAt, to),
      ),
    );
  const [w] = await db
    .select({
      earned: sql<number>`COALESCE(SUM(CASE WHEN ${wattsTransactions.amount} > 0 THEN ${wattsTransactions.amount} ELSE 0 END), 0)`,
    })
    .from(wattsTransactions)
    .where(
      and(
        eq(wattsTransactions.userId, userId),
        gte(wattsTransactions.createdAt, from),
        lt(wattsTransactions.createdAt, to),
      ),
    );
  return { answered: Number(p?.n ?? 0), watts: Number(w?.earned ?? 0) };
}

const COLUMNS = {
  id: users.id,
  name: users.name,
  email: users.email,
  timezone: users.timezone,
  createdAt: users.createdAt,
  trialEndsAt: users.trialEndsAt,
  subscriptionStatus: users.subscriptionStatus,
  notificationPrefs: users.notificationPrefs,
};

const appUser = and(isNull(users.deletedAt), isNotNull(users.timezone));
// Never paid through Apple (or the retired web billing): E-08.
const neverPaid = or(isNull(users.subscriptionSource), eq(users.subscriptionSource, "trial"));
// Not Pro right now. Comps are 'active' with source 'trial', so this skips them too.
const notPro = or(
  isNull(users.subscriptionStatus),
  sql`${users.subscriptionStatus} NOT IN ('active', 'past_due', 'canceled')`,
);

/** Claim a message for a user. False when another run already claimed it. */
async function claim(
  userId: string,
  message: OfferMessageValue,
  now: Date,
  extra: { version?: string; code?: string } = {},
): Promise<string | null> {
  const id = crypto.randomUUID();
  try {
    await db.insert(offerMessages).values({
      id,
      userId,
      message,
      version: extra.version ?? null,
      code: extra.code ?? null,
      sentAt: now,
    });
    return id;
  } catch {
    return null; // unique (user_id, message): already sent
  }
}

async function unclaim(id: string) {
  await db.delete(offerMessages).where(eq(offerMessages.id, id));
}

async function sendEmail(
  user: Candidate,
  message: OfferMessageValue,
  rendered: Rendered,
): Promise<string> {
  const { data, error } = await resend().emails.send(
    {
      from: offerFrom()!,
      to: user.email,
      replyTo: replyTo(),
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      headers: {
        "List-Unsubscribe": `<${oneClickUrl(user.id)}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      tags: [{ name: "offer", value: message }],
    },
    { idempotencyKey: `offer/${user.id}/${message}` },
  );
  if (error || !data) throw new Error(error?.message ?? "Resend returned no id");
  return data.id;
}

function footer(userId: string) {
  return { unsubscribeUrl: unsubscribePageUrl(userId), mailingAddress: mailingAddress() ?? "" };
}

export async function runOfferJob(opts: { live: boolean; now?: Date }): Promise<RunResult> {
  const now = opts.now ?? new Date();
  const started = Date.now();
  const problems = liveSendProblems();
  const live = opts.live && problems.length === 0;

  const result: RunResult = {
    mode: live ? "live" : "test",
    problems,
    cap: dailyCap(),
    sentTodayBefore: 0,
    day6: { due: 0, sent: 0, ids: [] },
    day19: { due: 0, sent: 0, ids: [] },
    day15: { due: 0, sent: 0, versionA: 0, versionB: 0, codeOnly: 0, waitingForCap: 0, ids: [] },
    pushes: { sent: 0, failed: 0 },
    skippedUnsubscribed: 0,
    skippedSunday: 0,
    failures: 0,
    codesLeft: 0,
    warnings: [],
    stoppedEarly: false,
  };

  // Emails already sent today (UTC) count against the cap, so a second run on
  // the same day can't double it.
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const [sentToday] = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(offerMessages)
    .where(and(inArray(offerMessages.message, EMAIL_MESSAGES), gte(offerMessages.sentAt, startOfDay)));
  result.sentTodayBefore = Number(sentToday?.n ?? 0);
  let room = Math.max(0, result.cap - result.sentTodayBefore);
  const outOfTime = () => Date.now() - started > TIME_BUDGET_MS;

  result.codesLeft = await codesLeft(now);

  // ── 1. Email 1: the free week ends tomorrow ─────────────────────────────
  const day6Candidates: Candidate[] = await db
    .select(COLUMNS)
    .from(users)
    .where(
      and(
        appUser,
        eq(users.subscriptionStatus, "trialing"),
        gt(users.trialEndsAt, now),
        lte(users.trialEndsAt, new Date(now.getTime() + 3 * DAY_MS)),
      ),
    );

  const sentRows = async (ids: string[]) => {
    const out = new Map<string, Set<string>>();
    for (let i = 0; i < ids.length; i += 400) {
      const chunk = ids.slice(i, i + 400);
      if (chunk.length === 0) continue;
      const rows = await db
        .select({ userId: offerMessages.userId, message: offerMessages.message })
        .from(offerMessages)
        .where(inArray(offerMessages.userId, chunk));
      for (const r of rows) {
        if (!out.has(r.userId)) out.set(r.userId, new Set());
        out.get(r.userId)!.add(r.message);
      }
    }
    return out;
  };

  const day6Sent = await sentRows(day6Candidates.map((u) => u.id));
  for (const u of day6Candidates) {
    if (day6Sent.get(u.id)?.has("day6_email")) continue;
    if (isLocalSunday(now, u.timezone)) {
      result.skippedSunday++;
      continue;
    }
    const when = day6Due(now, u.trialEndsAt!, u.timezone);
    if (!when) continue;
    if (offerEmailsOff(u.notificationPrefs)) {
      result.skippedUnsubscribed++;
      continue;
    }
    result.day6.due++;
    if (room <= 0 || outOfTime()) {
      result.stoppedEarly = true;
      continue;
    }
    result.day6.ids.push(u.id);
    if (!live) {
      room--;
      continue;
    }
    const stats = await statsBetween(u.id, u.createdAt, now);
    const claimId = await claim(u.id, "day6_email", now);
    if (!claimId) continue;
    try {
      const providerId = await sendEmail(
        u,
        "day6_email",
        renderDay6({ name: u.name, when, ...stats, fullPrice: fullPriceText() }, footer(u.id)),
      );
      await db.update(offerMessages).set({ providerId }).where(eq(offerMessages.id, claimId));
      result.day6.sent++;
      room--;
    } catch (err) {
      console.error("[offer] day6 send failed", u.id, err);
      await unclaim(claimId);
      result.failures++;
    }
    await sleep(SEND_SPACING_MS);
  }

  // ── 2 and 3: people whose free week is over and who never paid ──────────
  const offerCandidates: Candidate[] = await db
    .select(COLUMNS)
    .from(users)
    .where(
      and(
        appUser,
        neverPaid,
        notPro,
        or(
          lte(users.trialEndsAt, now),
          and(isNull(users.trialEndsAt), lte(users.createdAt, new Date(now.getTime() - 7 * DAY_MS))),
        ),
      ),
    );
  const offerSent = await sentRows(offerCandidates.map((u) => u.id));
  const codes = await codeRows(offerCandidates.map((u) => u.id));

  // ── 2. Email 3: reminder before the use-by date ─────────────────────────
  for (const u of offerCandidates) {
    const sent = offerSent.get(u.id);
    if (!sent?.has("day15_email") || sent.has("day19_email")) continue;
    const given = codes.get(u.id);
    if (!given) continue;
    const daysLeft = day19Due(now, given.givenAt, u.timezone);
    if (daysLeft === null) continue;
    if (offerEmailsOff(u.notificationPrefs)) {
      result.skippedUnsubscribed++;
      continue;
    }
    result.day19.due++;
    if (room <= 0 || outOfTime()) {
      result.stoppedEarly = true;
      continue;
    }
    result.day19.ids.push(u.id);
    if (!live) {
      room--;
      continue;
    }
    const claimId = await claim(u.id, "day19_email", now, { code: given.code });
    if (!claimId) continue;
    try {
      const providerId = await sendEmail(
        u,
        "day19_email",
        renderDay19(
          {
            name: u.name,
            daysLeft,
            code: given.code,
            redeemUrl: redeemUrl(given.code),
            useBy: offerDeadline(given.givenAt),
            timeZone: u.timezone ?? DEFAULT_TIME_ZONE,
            price: offerPriceText(),
            fullPrice: fullPriceText(),
          },
          footer(u.id),
        ),
      );
      await db.update(offerMessages).set({ providerId }).where(eq(offerMessages.id, claimId));
      result.day19.sent++;
      room--;
    } catch (err) {
      console.error("[offer] day19 send failed", u.id, err);
      await unclaim(claimId);
      result.failures++;
    }
    await sleep(SEND_SPACING_MS);
  }

  // ── 3. Email 2 and the code, newest free-week end first ─────────────────
  const day15Queue = offerCandidates
    .filter((u) => !offerSent.get(u.id)?.has("day15_email"))
    .map((u) => ({ u, weekEnd: freeWeekEnd(u) }))
    .filter(({ u, weekEnd }) => {
      if (isLocalSunday(now, u.timezone)) {
        result.skippedSunday++;
        return false;
      }
      return day15Due(now, weekEnd, u.timezone);
    })
    .sort((a, b) => b.weekEnd.getTime() - a.weekEnd.getTime());

  let poolEmpty = false;
  for (const { u, weekEnd } of day15Queue) {
    // Already holds a code (e.g. unsubscribed earlier): nothing more to do.
    if (codes.has(u.id)) continue;
    const unsubscribed = offerEmailsOff(u.notificationPrefs);
    if (!unsubscribed) result.day15.due++;

    if (unsubscribed) {
      // No email or push, but their code still shows on the paywall.
      result.skippedUnsubscribed++;
      if (live && !poolEmpty) {
        const given = await giveCode(u.id, now);
        if (given) result.day15.codeOnly++;
        else poolEmpty = true;
      } else if (!live) {
        result.day15.codeOnly++;
      }
      continue;
    }
    if (room <= 0 || outOfTime() || poolEmpty) {
      result.day15.waitingForCap++;
      if (outOfTime()) result.stoppedEarly = true;
      continue;
    }

    const stats = await statsBetween(u.id, u.createdAt, weekEnd);
    const version = stats.answered >= OFFER_STUDIED_THRESHOLD ? "A" : "B";
    result.day15.ids.push(u.id);
    if (version === "A") result.day15.versionA++;
    else result.day15.versionB++;
    if (!live) {
      room--;
      continue;
    }

    const given = await giveCode(u.id, now);
    if (!given) {
      poolEmpty = true;
      result.day15.waitingForCap++;
      continue;
    }
    const claimId = await claim(u.id, "day15_email", now, { version, code: given.code });
    if (!claimId) continue;
    const tz = u.timezone ?? DEFAULT_TIME_ZONE;
    const useBy = offerDeadline(given.givenAt);
    try {
      const providerId = await sendEmail(
        u,
        "day15_email",
        renderDay15(
          {
            name: u.name,
            version,
            ...stats,
            code: given.code,
            redeemUrl: redeemUrl(given.code),
            useBy,
            timeZone: tz,
            price: offerPriceText(),
            fullPrice: fullPriceText(),
          },
          footer(u.id),
        ),
      );
      await db.update(offerMessages).set({ providerId }).where(eq(offerMessages.id, claimId));
      result.day15.sent++;
      room--;
    } catch (err) {
      console.error("[offer] day15 send failed", u.id, err);
      await unclaim(claimId);
      // They were never told about the code: put it back in the pool.
      await releaseCode(u.id, given.code);
      result.failures++;
      await sleep(SEND_SPACING_MS);
      continue;
    }

    // One push, only to people who already allowed notifications (E-09).
    const tokens = await tokensForUser(u.id);
    if (tokens.length > 0) {
      const pushClaim = await claim(u.id, "day15_push", now, { code: given.code });
      if (pushClaim) {
        const { title, body } = day15Push(offerPriceText(), useBy, tz);
        const pushed = await sendPushNotifications(
          tokens.map((to) => ({
            to,
            title,
            body,
            data: { type: "offer", route: "/paywall" },
            sound: "default" as const,
          })),
        );
        result.pushes.sent += pushed.sent;
        result.pushes.failed += pushed.failed;
        if (pushed.sent === 0) await unclaim(pushClaim);
      }
    }
    await sleep(SEND_SPACING_MS);
  }

  if (live) result.codesLeft = await codesLeft(now);
  if (poolEmpty) result.warnings.push("The code pool is empty: import a new batch.");
  else if (result.codesLeft < LOW_CODE_WARNING) {
    result.warnings.push(`Only ${result.codesLeft} offer codes left: import a new batch soon.`);
  }
  if (opts.live && !live) {
    result.warnings.push(`Live sending is on but can't run: ${problems.join("; ")}.`);
  }
  return result;
}

/** The codes already given to these users, by user id. */
async function codeRows(ids: string[]): Promise<Map<string, GivenCode>> {
  const out = new Map<string, GivenCode>();
  for (let i = 0; i < ids.length; i += 400) {
    const chunk = ids.slice(i, i + 400);
    if (chunk.length === 0) continue;
    const rows = await db
      .select({ userId: offerCodes.userId, code: offerCodes.code, givenAt: offerCodes.givenAt })
      .from(offerCodes)
      .where(inArray(offerCodes.userId, chunk));
    for (const r of rows) {
      if (r.userId && r.givenAt) out.set(r.userId, { code: r.code, givenAt: r.givenAt });
    }
  }
  return out;
}

async function releaseCode(userId: string, code: string) {
  await db
    .update(offerCodes)
    .set({ userId: null, givenAt: null })
    .where(and(eq(offerCodes.code, code), eq(offerCodes.userId, userId)));
}
