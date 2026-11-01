// Sparky's words. Hand-written templates for every notification type — the
// phase-1 voice, and the fallback once an AI writer is added in phase 2.
//
// Voice rules (see the proposal doc):
//   - one real number from the user's own data in every message
//   - one clear ask that takes under 5 minutes
//   - at most one electrical pun, none when the user is struggling
//   - never guilt or shame
//   - title ≤ 40 chars, body ≤ 120 chars so iOS shows it whole

import type { Candidate, SparkyMessage } from "./types";

export const MAX_TITLE = 40;
export const MAX_BODY = 120;

type Words = { title: string; body: string };
type Variant<C> = (c: C, name: string | null) => Words;
type Of<T extends Candidate["type"]> = Extract<Candidate, { type: T }>;

const comma = (name: string | null) => (name ? `, ${name}` : "");
const pctOf = (t: { answered: number; correct: number }) =>
  t.answered > 0 ? Math.round((t.correct / t.answered) * 100) : 0;
const plural = (n: number, word: string) => `${n.toLocaleString("en-US")} ${word}${n === 1 ? "" : "s"}`;

const STREAK_SAVER: Variant<Of<"streak_saver">>[] = [
  (c, n) =>
    c.streak > 0
      ? { title: `${c.streak} days strong${comma(n)} ⚡`, body: "Don't let the breaker trip tonight. One daily challenge keeps the streak live." }
      : { title: "Got 5 minutes?", body: "One daily challenge is all it takes to start a new streak. I'll keep score." },
  (c) =>
    c.streak > 0
      ? { title: `Your ${c.streak}-day streak is waiting`, body: "Knock out today's daily challenge and keep the current flowing." }
      : { title: "Sparky here, checking in ⚡", body: "A quick daily challenge today sets up tomorrow. Five minutes, tops." },
  (c, n) =>
    c.streak > 0
      ? { title: `Day ${c.streak + 1} is one quiz away`, body: `Still time today${comma(n)}. One daily challenge and the streak keeps climbing.` }
      : { title: "Let's get one in today", body: "Five questions in the daily challenge. Small reps add up before exam day." },
];

const EXAM_COUNTDOWN: Variant<Of<"exam_countdown">>[] = [
  (c) => {
    const when = c.daysLeft === 1 ? "Exam tomorrow" : `${c.daysLeft} days to exam day`;
    const body = c.weakTopic
      ? `${c.weakTopic.name} is your last soft spot at ${pctOf(c.weakTopic)}%. Ten minutes on it today pays off.`
      : "Keep the reps going. Today's daily challenge keeps you sharp.";
    return { title: `${when}. You've got this.`, body };
  },
  (c, n) => {
    const title = c.daysLeft === 1 ? `Tomorrow's the day${comma(n)}` : `${c.daysLeft} days out${comma(n)}`;
    const body =
      c.daysLeft === 1
        ? "Light review today, then rest. You've put in the work. Get some sleep tonight."
        : c.weakTopic
          ? `Spend today on ${c.weakTopic.name} (${c.weakTopic.necArticle}). That's where the points are.`
          : "Keep the daily reps going. Steady practice beats cramming every time.";
    return { title, body };
  },
];

const MILESTONE: Variant<Of<"milestone">>[] = [
  (c, n) => {
    switch (c.kind) {
      case "rank":
        return { title: `You're a ${c.rankTitle} ⚡`, body: `New rank unlocked${comma(n)}. The circuits are humming. Tap to see how far you've come.` };
      case "streak":
        return { title: `${c.days}-day streak! 🔥`, body: `${c.days} days in a row${comma(n)}. That's how licenses get earned. Keep it rolling.` };
      case "questions":
        return { title: `${c.count.toLocaleString("en-US")} questions answered`, body: `You just passed ${c.count.toLocaleString("en-US")} questions. That's real code knowledge stacking up.` };
    }
  },
  (c, n) => {
    switch (c.kind) {
      case "rank":
        return { title: "Rank up! ⚡", body: `${n ? `${n}, you're` : "You're"} officially a ${c.rankTitle}. Proud of you. Let's see the next one.` };
      case "streak":
        return { title: `${c.days} days. No days off.`, body: "That streak is serious discipline. I'm flexing for you. Tap to see your progress." };
      case "questions":
        return { title: `Milestone: ${c.count.toLocaleString("en-US")} questions`, body: `${c.count.toLocaleString("en-US")} questions down${comma(n)}. Every one of them is a point on exam day.` };
    }
  },
];

const WEEKLY_REPORT: Variant<Of<"weekly_report">>[] = [
  (c) => {
    // Only celebrate improvement; a dip isn't worth a push-notification frown.
    const trend = c.deltaPct !== null && c.deltaPct > 0 ? ` (up ${c.deltaPct} pts)` : "";
    const best = c.bestTopic ? ` ${c.bestTopic.name} is your strongest circuit.` : "";
    return { title: "Your week, by the numbers", body: `${plural(c.answered, "question")}, ${c.pct}% right${trend}.${best} Tap for the full report.` };
  },
  (c, n) => {
    const streak = c.streak > 0 ? ` and a ${c.streak}-day streak` : "";
    return {
      title: `Week in review${comma(n)} ⚡`,
      body: `${plural(c.answered, "question")} at ${c.pct}%${streak}. Tap to see where you're strongest.`,
    };
  },
];

const WEAK_SPOT: Variant<Of<"weak_spot">>[] = [
  (c) => ({
    title: `${c.topic.name} is fighting back`,
    body: `You're at ${pctOf(c.topic)}% on ${c.topic.necArticle}. Five focused questions and we'll tighten it up.`,
  }),
  (c, n) => ({
    title: `Let's work on ${c.topic.name}`,
    body: `${pctOf(c.topic)}% over your last ${c.topic.answered} tries${comma(n)}. A short quiz today moves that number.`,
  }),
];

const REVIEW_DUE: Variant<Of<"review_due">>[] = [
  (c) => ({ title: `${c.count} questions ready for review`, body: "Catch them now while they're fresh. A quick review locks them in for exam day." }),
  (c, n) => ({ title: `Review time${comma(n)}`, body: `${c.count} questions are due. Ten minutes of review beats an hour of cramming.` }),
];

const COMEBACK: Variant<Of<"comeback">>[] = [
  (c) => ({ title: "The panel's still here when you are", body: `It's been ${c.daysAway} days. One quick daily challenge gets the current flowing again.` }),
  (c, n) => ({ title: `Hey${n ? ` ${n}` : ""}, Sparky here`, body: `${c.daysAway} days away is no big deal. One daily challenge and you're back in it.` }),
];

const SPECS: { [T in Candidate["type"]]: { variants: Variant<Of<T>>[]; pose: string } } = {
  streak_saver: { variants: STREAK_SAVER, pose: "warning" },
  exam_countdown: { variants: EXAM_COUNTDOWN, pose: "cowboy" },
  milestone: { variants: MILESTONE, pose: "excited" },
  weekly_report: { variants: WEEKLY_REPORT, pose: "proud" },
  weak_spot: { variants: WEAK_SPOT, pose: "thinking" },
  review_due: { variants: REVIEW_DUE, pose: "calm" },
  comeback: { variants: COMEBACK, pose: "calm" },
};

/** Screen each type opens, as an expo-router path. */
export function routeFor(c: Candidate): string {
  switch (c.type) {
    case "streak_saver":
    case "comeback":
      return "/daily";
    case "exam_countdown":
      return c.weakTopic ? `/quiz/${c.weakTopic.slug}` : "/daily";
    case "milestone":
    case "weekly_report":
      return "/progress";
    case "weak_spot":
      return `/quiz/${c.topic.slug}`;
    case "review_due":
      return "/review/daily";
  }
}

function clip(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Render a candidate in Sparky's voice. `lastVariant` is the variant used the
 * previous time this type was sent, so consecutive sends rotate wording.
 */
export function renderMessage(c: Candidate, firstName: string | null, lastVariant: number | null): SparkyMessage {
  const spec = SPECS[c.type] as { variants: Variant<Candidate>[]; pose: string };
  const variant = lastVariant === null ? 0 : (lastVariant + 1) % spec.variants.length;
  const words = spec.variants[variant](c, firstName);
  return {
    title: clip(words.title, MAX_TITLE),
    body: clip(words.body, MAX_BODY),
    pose: c.type === "milestone" && c.kind === "streak" ? "flexing" : spec.pose,
    route: routeFor(c),
    variant,
  };
}

/** First name from the profile name, or null when it's missing or looks like an email. */
export function firstNameOf(name: string | null | undefined): string | null {
  const first = (name ?? "").trim().split(/\s+/)[0] ?? "";
  if (!first || first.includes("@") || first.length > 20) return null;
  return first.charAt(0).toUpperCase() + first.slice(1);
}
