// Free automatic streak grace.
//
// A single missed day is forgiven automatically — no purchase, no tap — at most
// once per rolling 7-day window. This REPLACED the paid "Streak Fuse" power-up
// (which, on mobile, never actually worked: it was purchased but never activated,
// so `streak_fuse_expires_at` was never set). The one skip is tracked by
// `users.streak_skip_used_at`; when it's consumed we stamp it with the play time,
// and it becomes available again STREAK_SKIP_WINDOW_MS later.
//
// Day math elsewhere (lib/award-session.ts) is UTC-calendar based; this window is
// a plain 7×24h duration so "once a week" is measured from the last skip, not a
// fixed calendar week.

export const STREAK_SKIP_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** True when the user has a free skip available at `now`. */
export function isStreakSkipAvailable(
  lastSkipAt: Date | null | undefined,
  now: Date,
): boolean {
  return !lastSkipAt || now.getTime() - lastSkipAt.getTime() >= STREAK_SKIP_WINDOW_MS;
}

/**
 * ISO timestamp when the next free skip unlocks, or `null` if one is already
 * available. Drives the "skip used · back in Nd" copy on the client.
 */
export function streakSkipResetsAt(
  lastSkipAt: Date | null | undefined,
  now: Date,
): string | null {
  if (isStreakSkipAvailable(lastSkipAt, now)) return null;
  return new Date(lastSkipAt!.getTime() + STREAK_SKIP_WINDOW_MS).toISOString();
}
