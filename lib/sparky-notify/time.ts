// Timezone helpers. Turso/SQLite can't do IANA timezone math, so the engine
// pulls candidates broadly and works out each user's local clock in JS.

export interface LocalClock {
  /** Local calendar day, YYYY-MM-DD. */
  date: string;
  hour: number;
  minute: number;
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number;
}

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** The user's local clock at `when`, or null for an unknown timezone. */
export function localClock(tz: string, when: Date): LocalClock | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
      hour12: false,
    }).formatToParts(when);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    const hour = Number.parseInt(get("hour"), 10) % 24;  // some engines print "24" at midnight
    const minute = Number.parseInt(get("minute"), 10);
    const weekday = WEEKDAYS[get("weekday")];
    if (!Number.isInteger(hour) || !Number.isInteger(minute) || weekday === undefined) return null;
    return { date: `${get("year")}-${get("month")}-${get("day")}`, hour, minute, weekday };
  } catch {
    return null;
  }
}

/** Local calendar day (YYYY-MM-DD) of `when` in `tz`. */
export function localDate(tz: string, when: Date): string | null {
  return localClock(tz, when)?.date ?? null;
}

/** Whole days from day `a` to day `b` (both YYYY-MM-DD); positive when b is later. */
export function daysBetween(a: string, b: string): number {
  const ms = Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}
