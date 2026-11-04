// The Sparky notification engine: one pass over every user who can receive a
// push. Safe to run at any cadence (hourly is the target): every send is keyed
// in notification_log, so a missed run catches up inside each send window and
// an overlapping run can't double-send.

import crypto from "crypto";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { db, notificationLog, pushTokens, users } from "@/lib/db";
import { sendPushNotifications, tokensForUser, type PushMessage } from "@/lib/push";
import { loadActivity, loadHistory } from "./facts";
import { parseNotificationPrefs } from "./prefs";
import { coachingCandidate, hasAccess, isQuietDay, streakSaver, AFTERNOON, MORNING } from "./rules";
import { firstNameOf, renderMessage } from "./templates";
import { localClock } from "./time";
import type { Candidate, SentRecord, SparkyMessage, UserFacts } from "./types";

export interface RunSummary {
  candidates: number;
  queued: number;
  byType: Record<string, number>;
  push: { sent: number; failed: number; removed: number } | null;
  preview?: Array<{ userId: string; type: string; title: string; body: string; route: string }>;
}

function lastVariant(history: SentRecord[], type: string): number | null {
  const sameType = history.filter((h) => h.type === type).sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
  return sameType[0]?.variant ?? null;
}

export async function runSparkyNotifications(now: Date, opts: { dryRun?: boolean } = {}): Promise<RunSummary> {
  const rows = await db
    .selectDistinct({
      id: users.id,
      name: users.name,
      timezone: users.timezone,
      notificationPrefs: users.notificationPrefs,
      studyStreak: users.studyStreak,
      lastStudyDate: users.lastStudyDate,
      targetExamDate: users.targetExamDate,
      wattsLifetime: users.wattsLifetime,
      focusMode: users.focusMode,
      subscriptionStatus: users.subscriptionStatus,
      trialEndsAt: users.trialEndsAt,
    })
    .from(users)
    .innerJoin(pushTokens, eq(pushTokens.userId, users.id))
    .where(and(isNotNull(users.timezone), isNull(users.deletedAt)));

  const toSend: Array<{ userId: string; candidate: Candidate; message: SparkyMessage }> = [];

  for (const u of rows) {
    // Only people who can open the app today: see hasAccess.
    if (!hasAccess(u.subscriptionStatus ?? null, u.trialEndsAt ?? null, now)) continue;
    const clock = localClock(u.timezone!, now);
    // Sunday (their local time) is a day of rest: nothing goes out.
    if (!clock || isQuietDay(clock)) continue;

    const facts: UserFacts = {
      userId: u.id,
      firstName: firstNameOf(u.name),
      timezone: u.timezone!,
      prefs: parseNotificationPrefs(u.notificationPrefs),
      studyStreak: u.studyStreak ?? 0,
      lastStudyAt: u.lastStudyDate ?? null,
      targetExamDate: u.targetExamDate ?? null,
      wattsLifetime: u.wattsLifetime ?? 0,
      level: u.focusMode === "master" ? "master" : "journeyman",
      // Activity numbers are filled in below, only when coaching is possible.
      wattsThisWeek: 0,
      answeredTotal: 0,
      answeredThisWeek: 0,
      correctThisWeek: 0,
      answeredLastWeek: 0,
      correctLastWeek: 0,
      topicsThisWeek: [],
      topicsLastWeek: [],
      topics14d: [],
      reviewDue: 0,
    };

    const inCoachingWindow =
      (clock.hour >= MORNING.start && clock.hour < MORNING.end) ||
      (clock.hour >= AFTERNOON.start && clock.hour < AFTERNOON.end);

    // Cheap pre-check: skip the history query when nothing could fire now.
    const reminder = facts.prefs.dailyStreakReminder;
    const sinceReminder = clock.hour * 60 + clock.minute - (reminder.hour * 60 + reminder.minute);
    const reminderPossible = reminder.enabled && sinceReminder >= 0 && sinceReminder < 180;
    if (!inCoachingWindow && !reminderPossible) continue;

    const history = await loadHistory(u.id, now);

    const picks: Candidate[] = [];
    const saver = streakSaver(facts, history, clock);
    if (saver) picks.push(saver);

    if (inCoachingWindow) {
      Object.assign(facts, await loadActivity(u.id, now));
      const coaching = coachingCandidate(facts, history, clock, now);
      if (coaching) picks.push(coaching);
    }

    for (const candidate of picks) {
      toSend.push({
        userId: u.id,
        candidate,
        message: renderMessage(candidate, facts.firstName, lastVariant(history, candidate.type)),
      });
    }
  }

  const byType: Record<string, number> = {};
  for (const s of toSend) byType[s.candidate.type] = (byType[s.candidate.type] ?? 0) + 1;

  if (opts.dryRun) {
    return {
      candidates: rows.length,
      queued: toSend.length,
      byType,
      push: null,
      preview: toSend.map((s) => ({
        userId: s.userId,
        type: s.candidate.type,
        title: s.message.title,
        body: s.message.body,
        route: s.message.route,
      })),
    };
  }

  const messages: PushMessage[] = [];
  let queued = 0;
  for (const s of toSend) {
    // Claim the send first. The unique (user, dedup_key) index makes this the
    // lock: if another run already logged it, nothing is returned and we skip.
    const id = crypto.randomUUID();
    const claimed = await db
      .insert(notificationLog)
      .values({
        id,
        userId: s.userId,
        type: s.candidate.type,
        dedupKey: s.candidate.dedupKey,
        variant: s.message.variant,
        title: s.message.title,
        body: s.message.body,
        sentAt: now,
      })
      .onConflictDoNothing()
      .returning({ id: notificationLog.id });
    if (claimed.length === 0) continue;

    const tokens = await tokensForUser(s.userId);
    for (const token of tokens) {
      messages.push({
        to: token,
        title: s.message.title,
        body: s.message.body,
        sound: "default",
        data: {
          type: s.candidate.type,
          route: s.message.route,
          pose: s.message.pose,
          notificationId: id,
        },
      });
    }
    queued++;
  }

  const push = await sendPushNotifications(messages);
  return { candidates: rows.length, queued, byType, push };
}
