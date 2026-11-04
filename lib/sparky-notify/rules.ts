// Decides WHETHER Sparky sends something to a user right now, and WHAT.
// Pure: no database, no clock of its own — easy to test and reason about.
//
// Two lanes:
//   1. The streak saver is the daily reminder the user set up themselves. It
//      fires at their chosen time if they haven't studied today, and does not
//      count toward Sparky's coaching caps (it's an alarm they asked for).
//   2. Coaching messages (everything else) share the guardrails below and go
//      out in two local-time windows, highest priority first.
//
// Nothing goes out on Sunday in either lane: it's a day of rest.

import type { Candidate, Focus, SentRecord, TopicGain, TopicStat, UserFacts } from "./types";
import { daysBetween, localDate, type LocalClock } from "./time";
import { getUserClassification } from "@/lib/voltage";

// ── Guardrails ───────────────────────────────────────────────────────────────
export const MAX_COACHING_PER_DAY = 1;
export const MAX_COACHING_PER_WEEK = 4;
/** Stop coaching once this many messages went unanswered by any studying. */
export const MAX_UNANSWERED = 3;
/** The streak saver may fire up to this long after the user's chosen time (missed cron runs). */
export const STREAK_SAVER_GRACE_MIN = 180;

/** Local-time windows [start, end) in hours. Nothing is sent outside 8am–9pm. */
export const MORNING = { start: 9, end: 12 };
export const AFTERNOON = { start: 16, end: 19 };

/** Sunday is a day of rest: nothing goes out all day, in the user's local time. */
export const QUIET_WEEKDAY = 0;
const SATURDAY = 6;
/** The weekly progress report goes out Monday morning. */
export const REPORT_WEEKDAY = 1;

export function isQuietDay(clock: LocalClock): boolean {
  return clock.weekday === QUIET_WEEKDAY;
}

// ── Thresholds ───────────────────────────────────────────────────────────────
export const EXAM_COUNTDOWN_DAYS = [30, 14, 7, 3, 1];
export const STREAK_MILESTONES = [7, 14, 30, 50, 100, 200, 365];
export const QUESTION_MILESTONES = [100, 250, 500, 1000, 2500, 5000, 10000];
export const WEAK_SPOT_MIN_ANSWERED = 15;
export const WEAK_SPOT_PCT = 70;
export const WEAK_SPOT_COOLDOWN_DAYS = 7;
export const REVIEW_DUE_MIN = 10;
export const REVIEW_DUE_COOLDOWN_DAYS = 3;
export const COMEBACK_STEPS = [3, 7, 14];
/** Last week needs this many answers before "up 6%" means anything. */
const MIN_ANSWERED_FOR_DELTA = 10;

// Weekly report: "how you did" plus one area to work on next.
/** A topic needs this many answers in 14 days before the report calls it weak. */
export const FOCUS_MIN_ANSWERED = 8;
/** At or under this many answers in 14 days, a topic counts as unpracticed. */
export const UNPRACTICED_MAX_ANSWERED = 2;
/** Both weeks need this many answers in a topic before "went from X% to Y%". */
export const IMPROVED_MIN_ANSWERED = 5;
/** Points a topic must climb week over week to be called out. */
export const IMPROVED_MIN_GAIN = 10;
/** The weak-spot nudge waits this long after a weekly report, so it reads as a follow-up. */
export const REPORT_FOLLOW_UP_GAP_DAYS = 3;
/**
 * Rough exam emphasis, most first (data/blueprints plus grounding, which runs
 * through the service and equipment sections). Only breaks ties between
 * equally unpracticed topics.
 */
const EXAM_EMPHASIS = [
  "calculations-and-theory",
  "grounding-bonding",
  "services",
  "wiring-methods",
  "special-occupancies",
  "box-fill",
  "motors-and-generators",
  "transformer-sizing",
];

const COACHING_TYPES = new Set([
  "exam_countdown",
  "milestone",
  "weekly_report",
  "weak_spot",
  "review_due",
  "comeback",
]);

const DAY_MS = 86_400_000;

function pct(t: { answered: number; correct: number }): number {
  return t.answered > 0 ? Math.round((t.correct / t.answered) * 100) : 0;
}

function inWindow(clock: LocalClock, w: { start: number; end: number }): boolean {
  return clock.hour >= w.start && clock.hour < w.end;
}

function wasSent(history: SentRecord[], key: string): boolean {
  return history.some((h) => h.dedupKey === key);
}

function sentWithin(history: SentRecord[], type: string, now: Date, days: number): boolean {
  return history.some((h) => h.type === type && now.getTime() - h.sentAt.getTime() < days * DAY_MS);
}

/** Weakest topic with enough answers to trust, or null. */
export function weakestTopic(topics: TopicStat[], minAnswered = WEAK_SPOT_MIN_ANSWERED): TopicStat | null {
  const trusted = topics.filter((t) => t.answered >= minAnswered && pct(t) < WEAK_SPOT_PCT);
  trusted.sort((a, b) => pct(a) - pct(b) || b.answered - a.answered);
  return trusted[0] ?? null;
}

/** Strongest topic worth bragging about (5+ answers, at least passing), or null. */
function bestTopic(topics: TopicStat[]): TopicStat | null {
  const trusted = topics.filter((t) => t.answered >= 5 && pct(t) >= WEAK_SPOT_PCT);
  trusted.sort((a, b) => pct(b) - pct(a) || b.answered - a.answered);
  return trusted[0] ?? null;
}

/** The topic that climbed the most since last week (10+ points, 5+ answers both weeks), or null. */
export function mostImproved(thisWeek: TopicStat[], lastWeek: TopicStat[]): TopicGain | null {
  let best: TopicGain | null = null;
  for (const t of thisWeek) {
    const prev = lastWeek.find((p) => p.slug === t.slug);
    if (!prev || t.answered < IMPROVED_MIN_ANSWERED || prev.answered < IMPROVED_MIN_ANSWERED) continue;
    const gain = { topic: t, before: pct(prev), after: pct(t) };
    if (gain.after - gain.before < IMPROVED_MIN_GAIN) continue;
    if (!best || gain.after - gain.before > best.after - best.before) best = gain;
  }
  return best;
}

/**
 * What the weekly report asks them to work on: the weakest topic under the
 * passing mark (8+ answers in 14 days), else the most exam-relevant topic
 * they've barely practiced, else nothing (everything practiced is passing).
 * `topics` must list every known topic, including ones at 0 answered.
 */
export function focusTopic(topics: TopicStat[]): Focus | null {
  const weak = weakestTopic(topics, FOCUS_MIN_ANSWERED);
  if (weak) return { topic: weak, pct: pct(weak), reason: "weak" };
  const emphasis = (slug: string) => EXAM_EMPHASIS.indexOf(slug);
  const thin = topics
    .filter((t) => emphasis(t.slug) !== -1 && t.answered <= UNPRACTICED_MAX_ANSWERED)
    .sort((a, b) => a.answered - b.answered || emphasis(a.slug) - emphasis(b.slug));
  return thin[0] ? { topic: thin[0], pct: pct(thin[0]), reason: "unpracticed" } : null;
}

/**
 * Whether the account can use the app right now: an unexpired free week, or a
 * live subscription. RevenueCat keeps "active" through a cancellation until the
 * period ends, and "past_due" is Apple's billing-retry window. Matches
 * /api/profile, which reports an expired free week as "expired".
 *
 * Sparky sends nothing to anyone else: every push opens a screen behind the
 * paywall, and Apple only allows marketing pushes with explicit opt-in
 * (App Review Guideline 4.5.4).
 */
export function hasAccess(status: string | null, trialEndsAt: Date | null, now: Date): boolean {
  if (status === "active" || status === "past_due") return true;
  return status === "trialing" && trialEndsAt !== null && trialEndsAt.getTime() > now.getTime();
}

// ── Streak saver lane ────────────────────────────────────────────────────────
export function streakSaver(
  facts: UserFacts,
  history: SentRecord[],
  clock: LocalClock,
): Candidate | null {
  const pref = facts.prefs.dailyStreakReminder;
  if (!pref.enabled || isQuietDay(clock)) return null;
  const nowMin = clock.hour * 60 + clock.minute;
  const wantMin = pref.hour * 60 + pref.minute;
  if (nowMin < wantMin || nowMin >= wantMin + STREAK_SAVER_GRACE_MIN) return null;
  if (nowMin >= 21 * 60 && wantMin < 21 * 60) return null;  // a late catch-up never lands after 9pm
  const studiedToday =
    facts.lastStudyAt !== null && localDate(facts.timezone, facts.lastStudyAt) === clock.date;
  if (studiedToday) return null;
  const dedupKey = `streak_saver_${clock.date}`;
  if (wasSent(history, dedupKey)) return null;
  return { type: "streak_saver", dedupKey, streak: facts.studyStreak };
}

// ── Coaching lane ────────────────────────────────────────────────────────────
function examCountdown(facts: UserFacts, history: SentRecord[], clock: LocalClock): Candidate | null {
  if (!facts.prefs.examCountdown.enabled || !facts.targetExamDate) return null;
  // Exam dates are calendar days; read them in UTC so a noon-UTC date never shifts a day.
  const examDay = facts.targetExamDate.toISOString().slice(0, 10);
  const daysLeft = daysBetween(clock.date, examDay);
  // A countdown day that falls on a Sunday goes out on the Saturday before.
  const step = EXAM_COUNTDOWN_DAYS.includes(daysLeft)
    ? daysLeft
    : clock.weekday === SATURDAY && EXAM_COUNTDOWN_DAYS.includes(daysLeft - 1)
      ? daysLeft - 1
      : null;
  if (step === null) return null;
  const dedupKey = `exam_${step}_${examDay}`;
  if (wasSent(history, dedupKey)) return null;
  return {
    type: "exam_countdown",
    dedupKey,
    daysLeft,
    weakTopic: weakestTopic(facts.topics14d),
    level: facts.level,
  };
}

function milestone(facts: UserFacts, history: SentRecord[]): Candidate | null {
  if (!facts.prefs.milestones.enabled) return null;

  // Rank-up earned within the last week.
  const rank = getUserClassification(facts.wattsLifetime);
  const before = getUserClassification(Math.max(0, facts.wattsLifetime - facts.wattsThisWeek));
  if (rank.classification !== before.classification) {
    const key = `rank_${rank.classification}`;
    if (!wasSent(history, key)) {
      return { type: "milestone", dedupKey: key, kind: "rank", rankTitle: rank.title };
    }
  }

  // Streak milestone reached within the last week (never backfill old ones).
  const streakHit = [...STREAK_MILESTONES]
    .reverse()
    .find((n) => facts.studyStreak >= n && facts.studyStreak - 7 < n);
  if (streakHit) {
    const key = `streak_${streakHit}`;
    if (!wasSent(history, key)) return { type: "milestone", dedupKey: key, kind: "streak", days: streakHit };
  }

  // Question-count milestone crossed this week.
  const qHit = [...QUESTION_MILESTONES]
    .reverse()
    .find((n) => facts.answeredTotal >= n && facts.answeredTotal - facts.answeredThisWeek < n);
  if (qHit) {
    const key = `questions_${qHit}`;
    if (!wasSent(history, key)) return { type: "milestone", dedupKey: key, kind: "questions", count: qHit };
  }
  return null;
}

function weeklyReport(facts: UserFacts, history: SentRecord[], clock: LocalClock): Candidate | null {
  if (!facts.prefs.weeklyDigest.enabled || clock.weekday !== REPORT_WEEKDAY) return null;
  if (facts.answeredThisWeek === 0) return null;
  const dedupKey = `weekly_${clock.date}`;
  if (wasSent(history, dedupKey)) return null;
  const thisPct = pct({ answered: facts.answeredThisWeek, correct: facts.correctThisWeek });
  const deltaPct =
    facts.answeredLastWeek >= MIN_ANSWERED_FOR_DELTA
      ? thisPct - pct({ answered: facts.answeredLastWeek, correct: facts.correctLastWeek })
      : null;
  return {
    type: "weekly_report",
    dedupKey,
    answered: facts.answeredThisWeek,
    pct: thisPct,
    deltaPct,
    bestTopic: bestTopic(facts.topicsThisWeek),
    improved: mostImproved(facts.topicsThisWeek, facts.topicsLastWeek),
    focus: focusTopic(facts.topics14d),
    level: facts.level,
    streak: facts.studyStreak,
    watts: facts.wattsThisWeek,
  };
}

function weakSpot(facts: UserFacts, history: SentRecord[], clock: LocalClock, now: Date): Candidate | null {
  if (!facts.prefs.weakSpots.enabled) return null;
  if (sentWithin(history, "weak_spot", now, WEAK_SPOT_COOLDOWN_DAYS)) return null;
  // The Monday report already named an area; give them a few days with it.
  if (sentWithin(history, "weekly_report", now, REPORT_FOLLOW_UP_GAP_DAYS)) return null;
  const topic = weakestTopic(facts.topics14d);
  if (!topic) return null;
  return { type: "weak_spot", dedupKey: `weak_${topic.slug}_${clock.date}`, topic, level: facts.level };
}

function reviewDue(facts: UserFacts, history: SentRecord[], clock: LocalClock, now: Date): Candidate | null {
  if (!facts.prefs.reviewDue.enabled || facts.reviewDue < REVIEW_DUE_MIN) return null;
  if (sentWithin(history, "review_due", now, REVIEW_DUE_COOLDOWN_DAYS)) return null;
  return { type: "review_due", dedupKey: `review_${clock.date}`, count: facts.reviewDue };
}

function comeback(facts: UserFacts, history: SentRecord[], clock: LocalClock): Candidate | null {
  if (!facts.prefs.comeback.enabled || !facts.lastStudyAt) return null;
  const lastDay = localDate(facts.timezone, facts.lastStudyAt);
  if (!lastDay) return null;
  const away = daysBetween(lastDay, clock.date);
  // Only the step just reached: someone 12 days out gets nothing until day 14.
  const step = COMEBACK_STEPS.find((s) => away >= s && away < s + 3);
  if (!step) return null;
  const dedupKey = `comeback_${step}_${lastDay}`;
  if (wasSent(history, dedupKey)) return null;
  return { type: "comeback", dedupKey, daysAway: away };
}

/** Why coaching is blocked right now, or null when it may send. */
export function coachingBlockedReason(
  facts: UserFacts,
  history: SentRecord[],
  clock: LocalClock,
  now: Date,
): string | null {
  const coaching = history.filter((h) => COACHING_TYPES.has(h.type));
  const today = coaching.filter((h) => localDate(facts.timezone, h.sentAt) === clock.date);
  if (today.length >= MAX_COACHING_PER_DAY) return "daily_cap";
  const week = coaching.filter((h) => now.getTime() - h.sentAt.getTime() < 7 * DAY_MS);
  if (week.length >= MAX_COACHING_PER_WEEK) return "weekly_cap";
  const lastStudy = facts.lastStudyAt?.getTime() ?? 0;
  const unanswered = coaching.filter((h) => h.sentAt.getTime() > lastStudy);
  if (unanswered.length >= MAX_UNANSWERED) return "unanswered";
  return null;
}

/** The coaching message to send now, highest priority first, or null. */
export function coachingCandidate(
  facts: UserFacts,
  history: SentRecord[],
  clock: LocalClock,
  now: Date,
): Candidate | null {
  if (isQuietDay(clock) || coachingBlockedReason(facts, history, clock, now)) return null;
  if (inWindow(clock, MORNING)) {
    return (
      examCountdown(facts, history, clock) ??
      weeklyReport(facts, history, clock) ??  // Mondays only; a milestone can wait a day
      milestone(facts, history)
    );
  }
  if (inWindow(clock, AFTERNOON)) {
    return (
      weakSpot(facts, history, clock, now) ??
      reviewDue(facts, history, clock, now) ??
      comeback(facts, history, clock)
    );
  }
  return null;
}
