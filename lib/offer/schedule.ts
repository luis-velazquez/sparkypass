// When each offer message is due (HQ Plan/sparkypass-offer-emails-plan.md).
//
// Pure functions, no database: the daily job (lib/offer/run.ts) feeds them
// dates and a time zone. Days are counted in the user's own time zone, so "the
// day before your free week ends" means their calendar day, not UTC's.
//
// Day 0 is sign-up and the free week ends on day 7:
//   day 6  email 1  "Your free week ends tomorrow" (Saturday says "Monday"
//                   when the week ends on a Monday)
//   day 15 email 2  their $0.99 code, good for USE_BY_DAYS days
//   day 19 email 3  reminder, a few days before the code's use-by date
// Nothing goes out on Sunday, in the user's time zone.

export const DAY15_AFTER_END_DAYS = 8; // free week ends on day 7, so day 15 = end + 8
export const DAY19_AFTER_CODE_DAYS = 4;
export const USE_BY_DAYS = 7; // code given on day 15, use by day 22
export const FREE_WEEK_DAYS = 7;
export const DEFAULT_TIME_ZONE = "America/Chicago";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface LocalDay {
  /** Days since 1970-01-01 for the calendar date in the time zone. */
  index: number;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
}

function validTimeZone(tz: string | null | undefined): string {
  if (!tz) return DEFAULT_TIME_ZONE;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

/** The calendar day a moment falls on in a time zone. */
export function localDay(at: Date, tz: string | null | undefined): LocalDay {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: validTimeZone(tz),
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const utc = Date.UTC(get("year"), get("month") - 1, get("day"));
  const index = Math.round(utc / DAY_MS);
  return { index, weekday: new Date(utc).getUTCDay() };
}

/** Whole calendar days from `from` to `to` in the time zone (to − from). */
export function daysBetween(from: Date, to: Date, tz: string | null | undefined): number {
  return localDay(to, tz).index - localDay(from, tz).index;
}

export function isLocalSunday(at: Date, tz: string | null | undefined): boolean {
  return localDay(at, tz).weekday === 0;
}

/** The end of the free week. Accounts from the weeks when sign-up gave no free
 *  week have no trial_ends_at; their "week" is counted from sign-up. */
export function freeWeekEnd(user: { trialEndsAt: Date | null; createdAt: Date }): Date {
  return user.trialEndsAt ?? new Date(user.createdAt.getTime() + FREE_WEEK_DAYS * DAY_MS);
}

/**
 * Email 1. Returns "tomorrow" on the day before the free week ends, "monday"
 * on the Saturday before a Monday end (Sunday is skipped), else null.
 */
export function day6Due(
  now: Date,
  trialEndsAt: Date,
  tz: string | null | undefined,
): "tomorrow" | "monday" | null {
  if (trialEndsAt.getTime() <= now.getTime()) return null;
  const today = localDay(now, tz);
  if (today.weekday === 0) return null;
  const daysLeft = localDay(trialEndsAt, tz).index - today.index;
  if (daysLeft === 1) return "tomorrow";
  if (daysLeft === 2 && today.weekday === 6) return "monday";
  return null;
}

/** Email 2: on or after day 15 (a late run, or the backlog, still sends). */
export function day15Due(now: Date, weekEnd: Date, tz: string | null | undefined): boolean {
  if (isLocalSunday(now, tz)) return false;
  return daysBetween(weekEnd, now, tz) >= DAY15_AFTER_END_DAYS;
}

/** The code's use-by moment: USE_BY_DAYS after it was given. */
export function offerDeadline(givenAt: Date): Date {
  return new Date(givenAt.getTime() + USE_BY_DAYS * DAY_MS);
}

/**
 * Email 3: from DAY19_AFTER_CODE_DAYS after the code was given until its
 * use-by day. Returns how many calendar days are left (for the subject), or
 * null when it isn't due.
 */
export function day19Due(
  now: Date,
  givenAt: Date,
  tz: string | null | undefined,
): number | null {
  if (isLocalSunday(now, tz)) return null;
  const useBy = offerDeadline(givenAt);
  if (useBy.getTime() <= now.getTime()) return null;
  if (daysBetween(givenAt, now, tz) < DAY19_AFTER_CODE_DAYS) return null;
  const left = daysBetween(now, useBy, tz);
  return left >= 1 ? left : null;
}
