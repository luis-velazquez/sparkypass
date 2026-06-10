// Analytics event taxonomy — the SINGLE SOURCE OF TRUTH (web + mobile).
// See docs/analytics-instrumentation-plan.md §4.
//
// Collapses the three previously-divergent lists (the route allowlist,
// lib/analytics.ts EventName, hooks/useAnalytics.ts ClientEvent). The future RN
// app imports this verbatim. `funnel`/`step` are SERVER-derived from this catalog
// at ingest so they can never drift across platforms.
//
// This module must stay import-free so it is safe in client and server bundles.

export type Funnel = "activation" | "monetization" | "retention" | "core";
export type EventSide = "client" | "server";
export type Platform = "web" | "ios" | "android";

export interface EventDef {
  /** Which funnel this event belongs to (denormalized onto the row for cheap scans). */
  funnel: Funnel;
  /** Authoritative side. Money/Watts/streak events MUST be server-side. */
  side: EventSide;
  /** Funnel-step label — enables GROUP BY without JSON extraction. */
  step: string;
}

// `satisfies` validates every entry against EventDef while preserving the literal
// keys for the EventName union below.
export const EVENT_CATALOG = {
  // ── Activation ──────────────────────────────────────────────────────────
  app_open: { funnel: "activation", side: "client", step: "app_open" },
  signup_started: { funnel: "activation", side: "client", step: "signup_started" },
  signup_completed: { funnel: "activation", side: "server", step: "signup_completed" },
  onboarding_completed: { funnel: "activation", side: "client", step: "onboarding_completed" },
  first_quiz_completed: { funnel: "activation", side: "server", step: "first_quiz" },
  first_watts_earned: { funnel: "activation", side: "server", step: "first_watts" },
  paywall_viewed: { funnel: "activation", side: "client", step: "paywall_viewed" },

  // ── Monetization ────────────────────────────────────────────────────────
  checkout_started: { funnel: "monetization", side: "server", step: "checkout_started" },
  trial_started: { funnel: "monetization", side: "server", step: "trial_started" },
  subscription_converted: { funnel: "monetization", side: "server", step: "converted" },
  subscription_lapsed: { funnel: "monetization", side: "server", step: "lapsed" },
  winback_converted: { funnel: "monetization", side: "server", step: "winback" },
  upgrade_cta_clicked: { funnel: "monetization", side: "client", step: "upgrade_cta" },

  // ── Retention ───────────────────────────────────────────────────────────
  study_session_completed: { funnel: "retention", side: "server", step: "session" },
  daily_challenge_completed: { funnel: "retention", side: "server", step: "daily_challenge" },
  streak_extended: { funnel: "retention", side: "server", step: "streak_extended" },
  streak_at_risk: { funnel: "retention", side: "server", step: "streak_at_risk" },
  review_completed: { funnel: "retention", side: "server", step: "review" },

  // ── Core / growth ───────────────────────────────────────────────────────
  referral_completed: { funnel: "core", side: "server", step: "referral" },
  rank_advanced: { funnel: "core", side: "server", step: "rank_advanced" },
  feedback_submitted: { funnel: "core", side: "client", step: "feedback" },
  flag_exposed: { funnel: "core", side: "client", step: "flag_exposed" },
  page_view: { funnel: "core", side: "client", step: "page_view" },
} as const satisfies Record<string, EventDef>;

export type EventName = keyof typeof EVENT_CATALOG;

export const VALID_EVENTS = Object.keys(EVENT_CATALOG) as EventName[];

/** Type guard — true if `e` is a catalog event. Unknown events are dropped at ingest. */
export function isValidEvent(e: unknown): e is EventName {
  return typeof e === "string" && Object.prototype.hasOwnProperty.call(EVENT_CATALOG, e);
}

/** Server-derived funnel/step for a known event. */
export function getEventMeta(e: EventName): EventDef {
  return EVENT_CATALOG[e];
}
