// Porta Jon Challenge — a quick 3-question journeyman-knowledge quiz built for a
// restroom break. Sparky coaches, the user gets celebrated for choosing the
// throne over the scroll, and a short cooldown keeps it special.
//
// Gamification (mirrors the lib/voltage.ts CLASSIFICATIONS pattern):
//   • Throne streak — consecutive days a challenge was completed.
//   • Scrolls dodged — lifetime challenges completed; the anti-doomscroll tally
//     AND the metric the title ladder is keyed off (cumulative, never lost).
//   • Royal Flush — a clean 3/3 sweep earns a bonus + the "king" celebration.

export const PORTA_JON_ACTIVITY_TYPE = "porta_jon";

/** Questions per challenge (journeyman knowledge). */
export const PORTA_JON_QUESTION_COUNT = 3;

/** Short cooldown between counted challenges — keeps it a treat. */
export const PORTA_JON_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours

/** Bonus Watts for a clean 3/3 sweep ("Royal Flush"). */
export const PORTA_JON_ROYAL_FLUSH_BONUS = 50;

// ─── Titles (keyed off lifetime challenges completed = scrolls dodged) ───────

export interface PortaJonTitleConfig {
  /** Minimum lifetime scrolls-dodged to hold this title. */
  minScrolls: number;
  title: string;
  icon: string;
}

// Ascending by minScrolls. Jobsite humor, escalating royalty.
export const PORTA_JON_TITLES: PortaJonTitleConfig[] = [
  { minScrolls: 0, title: "Fresh Roll", icon: "🧻" },
  { minScrolls: 1, title: "Throne Scholar", icon: "📖" },
  { minScrolls: 10, title: "Stall Sage", icon: "🚽" },
  { minScrolls: 25, title: "Lord of the Latrine", icon: "⚡" },
  { minScrolls: 50, title: "King of the Porta Jon", icon: "👑" },
];

export function getPortaJonTitle(scrollsDodged: number): PortaJonTitleConfig {
  for (let i = PORTA_JON_TITLES.length - 1; i >= 0; i--) {
    if (scrollsDodged >= PORTA_JON_TITLES[i].minScrolls) return PORTA_JON_TITLES[i];
  }
  return PORTA_JON_TITLES[0];
}

/** Current title + the next one and progress toward it (for the result/profile). */
export function getPortaJonTitleProgress(scrollsDodged: number): {
  current: PortaJonTitleConfig;
  next: PortaJonTitleConfig | null;
  remaining: number; // challenges left to reach `next` (0 if maxed)
} {
  const current = getPortaJonTitle(scrollsDodged);
  const idx = PORTA_JON_TITLES.indexOf(current);
  const next = idx < PORTA_JON_TITLES.length - 1 ? PORTA_JON_TITLES[idx + 1] : null;
  return {
    current,
    next,
    remaining: next ? Math.max(0, next.minScrolls - scrollsDodged) : 0,
  };
}

/** Milliseconds remaining on the cooldown given the last completion time (0 = ready). */
export function portaJonCooldownRemaining(
  lastCompletedAt: Date | null | undefined,
  now: Date = new Date(),
): number {
  if (!lastCompletedAt) return 0;
  const elapsed = now.getTime() - lastCompletedAt.getTime();
  return Math.max(0, PORTA_JON_COOLDOWN_MS - elapsed);
}
