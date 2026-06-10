// Single source of truth for subscription/trial constants.
//
// The free trial is granted at signup in three places — web email signup
// (app/api/register), web OAuth (auth.ts signIn callback), and mobile OAuth
// (lib/auth-mobile) — and consumed by the trial UI (TrialStatusHeader,
// SubscriptionBanner). Keep the length here so those can never drift again.
//
// NOTE: the 30-day soft-delete grace in app/api/account is a DIFFERENT concept
// that happens to share the number — do NOT couple it to this constant.
//
// This module must stay import-free so it is safe in both client and server
// bundles (TrialStatusHeader is a "use client" component).

export const TRIAL_PERIOD_DAYS = 30;
export const TRIAL_PERIOD_MS = TRIAL_PERIOD_DAYS * 24 * 60 * 60 * 1000;
