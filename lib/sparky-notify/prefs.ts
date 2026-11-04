// Notification preferences, stored as JSON in users.notification_prefs.
// Shared by the prefs API route and the Sparky notification engine so both
// read the same defaults. Every type is on unless the user turns it off.

export interface NotificationPrefs {
  /** The user's own daily reminder ("streak saver") at a time they pick. */
  dailyStreakReminder: { enabled: boolean; hour: number; minute: number };
  /** Monday progress report (nothing is ever sent on Sunday). */
  weeklyDigest: { enabled: boolean };
  /** Countdown pushes at 30/14/7/3/1 days before the exam date. */
  examCountdown: { enabled: boolean };
  /** Rank-ups, streak and question-count milestones. */
  milestones: { enabled: boolean };
  /** "This topic is fighting back" coaching. */
  weakSpots: { enabled: boolean };
  /** Spaced-repetition questions due for review. */
  reviewDue: { enabled: boolean };
  /** Gentle check-ins after 3, 7 and 14 days away. */
  comeback: { enabled: boolean };
}

export const TOGGLE_KEYS = [
  "weeklyDigest",
  "examCountdown",
  "milestones",
  "weakSpots",
  "reviewDue",
  "comeback",
] as const;
export type ToggleKey = (typeof TOGGLE_KEYS)[number];

export const DEFAULT_PREFS: NotificationPrefs = {
  dailyStreakReminder: { enabled: true, hour: 19, minute: 0 },
  weeklyDigest: { enabled: true },
  examCountdown: { enabled: true },
  milestones: { enabled: true },
  weakSpots: { enabled: true },
  reviewDue: { enabled: true },
  comeback: { enabled: true },
};

/** Parse the stored blob, filling every missing key from DEFAULT_PREFS. */
export function parseNotificationPrefs(raw: string | null | undefined): NotificationPrefs {
  let parsed: Partial<NotificationPrefs> = {};
  if (raw) {
    try {
      const value = JSON.parse(raw);
      if (value && typeof value === "object") parsed = value as Partial<NotificationPrefs>;
    } catch {
      // fall through to defaults
    }
  }
  const out = {
    dailyStreakReminder: { ...DEFAULT_PREFS.dailyStreakReminder, ...(parsed.dailyStreakReminder ?? {}) },
  } as NotificationPrefs;
  for (const key of TOGGLE_KEYS) {
    out[key] = { ...DEFAULT_PREFS[key], ...(parsed[key] ?? {}) };
  }
  return out;
}
