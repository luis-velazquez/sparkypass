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
//
// Streak-save warning (the higher-urgency, load-bearing nudge): in the single
// [22:00, 22:15) local window, a user whose streak is alive (studied yesterday)
// but UNtouched today, with streak ≥ 3 and no active Streak Fuse, gets a
// last-chance "your streak ends at midnight" push instead of the generic
// reminder. Same one-window-per-day idempotency as above. The streak-save check
// runs first and `continue`s, so a user never gets both in the same run.

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

// Streak-save warning fires in the single 15-min window starting here (local).
// 22:00 = two hours before midnight: a genuine last chance, one window per day.
const STREAK_SAVE_MINUTES = 22 * 60; // 22:00 local

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
      lastStudyDate: users.lastStudyDate,
      streakFuseExpiresAt: users.streakFuseExpiresAt,
    })
    .from(users)
    .innerJoin(pushTokens, eq(pushTokens.userId, users.id))
    .where(and(isNotNull(users.timezone), isNull(users.deletedAt)));

  let queuedFor = 0;
  let queuedStreakSave = 0;
  let skippedNoMatch = 0;
  let skippedAlreadyDid = 0;
  let skippedDisabled = 0;

  const sendQueue: { userId: string; streak: number; tokens: string[] }[] = [];
  const streakSaveQueue: { userId: string; streak: number; tokens: string[] }[] = [];

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
    const localMinutes = local.hour * 60 + local.minute;

    // ── Streak-save warning (takes precedence over the generic reminder) ──
    // Fired once/day in [22:00, 22:15) local for a streak that's alive but
    // untouched today. An active Streak Fuse means tonight isn't a risk → skip.
    const streak = u.studyStreak ?? 0;
    const fuseActive =
      u.streakFuseExpiresAt != null && new Date(u.streakFuseExpiresAt) > now;
    const inStreakSaveWindow =
      localMinutes >= STREAK_SAVE_MINUTES && localMinutes < STREAK_SAVE_MINUTES + 15;
    if (inStreakSaveWindow && streak >= 3 && !fuseActive) {
      const yesterdayLocal = userLocalDateString(
        u.timezone,
        new Date(now.getTime() - 24 * 60 * 60 * 1000),
      );
      const lastStudyLocal = u.lastStudyDate
        ? userLocalDateString(u.timezone, new Date(u.lastStudyDate))
        : null;
      // At risk iff the last study day was yesterday: streak intact, but if
      // today passes untouched it resets at local midnight.
      if (lastStudyLocal && yesterdayLocal && lastStudyLocal === yesterdayLocal) {
        const tokens = await tokensForUser(u.id);
        if (tokens.length > 0) {
          streakSaveQueue.push({ userId: u.id, streak, tokens });
          queuedStreakSave++;
        }
        continue; // suppress the generic reminder for this user this run
      }
    }

    // ── Generic daily reminder ──
    // Match if local time is in [desired, desired+15min).
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

    sendQueue.push({ userId: u.id, streak, tokens });
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

  // Streak-save warnings — higher urgency, fired in the last-chance window.
  const streakSaveMessages = streakSaveQueue.flatMap(({ streak, tokens }) =>
    tokens.map((token) => ({
      to: token,
      title: `⚡ Your ${streak}-day streak ends at midnight`,
      body: "A few minutes of study now keeps it alive — don't lose your progress.",
      data: { type: "streak-save", streak },
      sound: "default" as const,
    })),
  );

  const result = await sendPushNotifications([...messages, ...streakSaveMessages]);

  console.log("[cron/streak-reminder]", {
    candidates: rows.length,
    queuedFor,
    queuedStreakSave,
    skippedNoMatch,
    skippedAlreadyDid,
    skippedDisabled,
    pushResult: result,
  });

  return NextResponse.json({
    ok: true,
    candidates: rows.length,
    queuedFor,
    queuedStreakSave,
    skippedNoMatch,
    skippedAlreadyDid,
    skippedDisabled,
    push: result,
    ran_at: now.toISOString(),
  });
}
