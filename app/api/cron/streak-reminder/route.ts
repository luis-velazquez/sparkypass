// GET /api/cron/streak-reminder
//
// Vercel Cron — every 15 minutes (vercel.json). For each user with:
//   - a registered push token
//   - notification_prefs.dailyStreakReminder.enabled === true
//   - a timezone set
//   - whose local clock NOW falls within the 15-minute window starting at
//     their preferred hour:minute
//   - AND who has NOT completed today's daily challenge (in their local day)
// → send a streak reminder push.
//
// Idempotency note: with a 15-min cron and 15-min UI increments, each user's
// preferred time hits exactly one cron run per day. Belt-and-suspenders: we
// also check daily-challenge completion at send time so a user who already
// did the daily by the time the cron fires gets skipped.

import { NextRequest, NextResponse } from "next/server";
import { eq, and, gte, isNotNull, isNull } from "drizzle-orm";
import {
  db,
  users,
  studySessions,
  pushTokens,
} from "@/lib/db";
import { sendPushNotifications, tokensForUser } from "@/lib/push";
import { verifyCronRequest } from "@/lib/cron-auth";

interface NotificationPrefs {
  dailyStreakReminder?: { enabled?: boolean; hour?: number; minute?: number };
}

function parsePrefs(raw: string | null): NotificationPrefs {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as NotificationPrefs;
  } catch {
    return {};
  }
}

// Returns the user's local hour and minute right now, for the given IANA tz.
// Uses Intl.DateTimeFormat which is locale-stable and tz-aware.
function userLocalHourMinute(tz: string, now: Date): { hour: number; minute: number } | null {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: tz,
    });
    const parts = fmt.formatToParts(now);
    const hour = Number.parseInt(parts.find((p) => p.type === "hour")?.value ?? "", 10);
    const minute = Number.parseInt(parts.find((p) => p.type === "minute")?.value ?? "", 10);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
    return { hour, minute };
  } catch {
    return null;
  }
}

// Returns the user's local date string (YYYY-MM-DD).
function userLocalDateString(tz: string, when: Date): string | null {
  try {
    const fmt = new Intl.DateTimeFormat("en-CA", {  // en-CA → YYYY-MM-DD
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: tz,
    });
    return fmt.format(when);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const now = new Date();
  const fifteenMinAgo = new Date(now.getTime() - 15 * 60 * 1000);

  // Load candidates: users with a push token, a timezone, and not soft-deleted.
  // We deliberately fetch a broad superset and filter in JS — timezone math is
  // not expressible in plain SQLite/Turso.
  const rows = await db
    .selectDistinct({
      id: users.id,
      timezone: users.timezone,
      notificationPrefs: users.notificationPrefs,
      studyStreak: users.studyStreak,
    })
    .from(users)
    .innerJoin(pushTokens, eq(pushTokens.userId, users.id))
    .where(and(isNotNull(users.timezone), isNull(users.deletedAt)));

  let queuedFor = 0;
  let skippedNoMatch = 0;
  let skippedAlreadyDid = 0;
  let skippedDisabled = 0;

  const sendQueue: { userId: string; streak: number; tokens: string[] }[] = [];

  for (const u of rows) {
    if (!u.timezone) {
      skippedNoMatch++;
      continue;
    }
    const prefs = parsePrefs(u.notificationPrefs).dailyStreakReminder;
    if (!prefs || prefs.enabled === false) {
      skippedDisabled++;
      continue;
    }
    const desiredHour = typeof prefs.hour === "number" ? prefs.hour : 19;
    const desiredMinute = typeof prefs.minute === "number" ? prefs.minute : 0;

    const local = userLocalHourMinute(u.timezone, now);
    if (!local) {
      skippedNoMatch++;
      continue;
    }

    // Match if local time is in [desired, desired+15min).
    const localMinutes = local.hour * 60 + local.minute;
    const desiredMinutes = desiredHour * 60 + desiredMinute;
    const diff = localMinutes - desiredMinutes;
    const inWindow = diff >= 0 && diff < 15;
    if (!inWindow) {
      skippedNoMatch++;
      continue;
    }

    // Check daily challenge completion. We could be fancier and compute "today
    // in local TZ" cutoff, but a simple "any daily_challenge session in the
    // last 18 hours" is a tight-enough heuristic (catches anyone who did the
    // daily today even just before midnight local).
    const recentDaily = await db
      .select({ id: studySessions.id })
      .from(studySessions)
      .where(
        and(
          eq(studySessions.userId, u.id),
          eq(studySessions.sessionType, "daily_challenge"),
          gte(studySessions.startedAt, new Date(now.getTime() - 18 * 60 * 60 * 1000)),
        ),
      )
      .limit(1);

    if (recentDaily.length > 0) {
      skippedAlreadyDid++;
      continue;
    }

    const tokens = await tokensForUser(u.id);
    if (tokens.length === 0) continue;

    sendQueue.push({ userId: u.id, streak: u.studyStreak ?? 0, tokens });
    queuedFor++;
  }

  // Build messages — one per (user × device).
  const messages = sendQueue.flatMap(({ streak, tokens }) =>
    tokens.map((token) => ({
      to: token,
      title: streak > 0 ? `Don't break your ${streak}-day streak ⚡` : "Sparky misses you ⚡",
      body:
        streak > 0
          ? "Knock out today's daily challenge to keep it alive."
          : "A quick daily challenge keeps the Watts flowing.",
      data: { type: "streak-reminder", streak },
      sound: "default" as const,
    })),
  );

  const result = await sendPushNotifications(messages);

  console.log("[cron/streak-reminder]", {
    candidates: rows.length,
    queuedFor,
    skippedNoMatch,
    skippedAlreadyDid,
    skippedDisabled,
    pushResult: result,
  });

  return NextResponse.json({
    ok: true,
    candidates: rows.length,
    queuedFor,
    skippedNoMatch,
    skippedAlreadyDid,
    skippedDisabled,
    push: result,
    ran_at: now.toISOString(),
  });
}
