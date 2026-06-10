// Voltage — Difficulty-based voltage with in-quiz streak boosts
// No more 7-tier system; replaced by user classification based on watts balance

import type { Difficulty } from "@/types/question";
import type { QuizVoltage, UserClassification, Scaffolding } from "@/types/reward-system";

// ─── Difficulty → Base Voltage ──────────────────────────────────────────────

export const DIFFICULTY_VOLTAGE: Record<Difficulty, QuizVoltage> = {
  apprentice: 120,
  journeyman: 208,
  master: 277,
};

// ─── Voltage Progression (for streak boosts) ────────────────────────────────

export const VOLTAGE_PROGRESSION: QuizVoltage[] = [120, 208, 277, 480];

/**
 * Get the voltage for a correct answer, boosted by consecutive correct streak.
 * - 0-4 streak: base voltage
 * - 5-9 streak: one tier up (120→208, 208→277, 277→480)
 * - 10+ streak: two tiers up (120→277, 208→480, 277→480 cap)
 */
export function getStreakBoostedVoltage(
  difficulty: Difficulty | string,
  consecutiveCorrect: number
): QuizVoltage {
  const diff = (difficulty || "journeyman") as Difficulty;
  const baseVoltage = DIFFICULTY_VOLTAGE[diff] ?? 208;
  const baseIndex = VOLTAGE_PROGRESSION.indexOf(baseVoltage as QuizVoltage);

  let boostTiers = 0;
  if (consecutiveCorrect >= 10) {
    boostTiers = 2;
  } else if (consecutiveCorrect >= 5) {
    boostTiers = 1;
  }

  const boostedIndex = Math.min(baseIndex + boostTiers, VOLTAGE_PROGRESSION.length - 1);
  return VOLTAGE_PROGRESSION[boostedIndex];
}

// ─── User Classification (Watts-based rank ladder) ──────────────────────────
// Keyed on LIFETIME Watts (monotonic) so spending power-ups never demotes a user.
// Single source of truth: the curve + colors + greeting + advancement copy all
// live here, so adding or renaming a rank is a one-line edit (no parallel maps).
// Thresholds tuned to the live economy (~1,000–2,000 W per study session):
// fast early ranks (~1–2 sessions), stretching to ~weekly, top rank near a
// ~3-month exam window. (Replaced the old 0/1K/1M/1B curve, which froze the
// progress bar after the first ~1,000 W.)

export interface ClassificationConfig {
  classification: UserClassification;
  title: string;
  /** Minimum LIFETIME Watts to hold this rank. */
  minWatts: number;
  icon: string;
  colors: { text: string; bg: string; glow: string };
  /** Rank-flavored dashboard greeting. */
  greeting: string;
  /** Shown when the user advances INTO this rank. */
  advancementMessage: string;
}

export const CLASSIFICATIONS: ClassificationConfig[] = [
  {
    classification: "milliwatt",
    title: "Milliwatt",
    minWatts: 0,
    icon: "⚡",
    colors: { text: "text-stone-400", bg: "bg-stone-400/10", glow: "" },
    greeting: "Welcome to SparkyPass! Every correct answer adds Watts — let's get the current flowing.",
    advancementMessage: "You're online! Start studying to power up your classification.",
  },
  {
    classification: "watt_electrician",
    title: "Watt Electrician",
    minWatts: 1_000,
    icon: "🔋",
    colors: { text: "text-slate-500 dark:text-slate-300", bg: "bg-slate-400/10", glow: "" },
    greeting: "Watt Electrician — your first 1,000W are in the bank. Keep building.",
    advancementMessage: "Watt Electrician! Your first 1,000W — the foundation is set.",
  },
  {
    classification: "kilowatt_electrician",
    title: "Kilowatt Electrician",
    minWatts: 3_000,
    icon: "🔌",
    colors: { text: "text-amber dark:text-sparky-green", bg: "bg-amber/10 dark:bg-sparky-green/10", glow: "drop-shadow-[0_0_4px_rgba(245,158,11,0.3)]" },
    greeting: "Kilowatt Electrician! The circuits are humming — push deeper into the code.",
    advancementMessage: "Kilowatt Electrician! Momentum is building — your NEC knowledge is compounding.",
  },
  {
    classification: "megawatt_electrician",
    title: "Megawatt Electrician",
    minWatts: 7_500,
    icon: "⚙️",
    colors: { text: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-500/10", glow: "drop-shadow-[0_0_5px_rgba(16,185,129,0.35)]" },
    greeting: "Megawatt Electrician! You're handling serious load now — keep it steady.",
    advancementMessage: "Megawatt Electrician! A week of real work — high-voltage concepts with ease.",
  },
  {
    classification: "gigawatt_electrician",
    title: "Gigawatt Electrician",
    minWatts: 15_000,
    icon: "🏭",
    colors: { text: "text-sky-500 dark:text-sky-400", bg: "bg-sky-500/10", glow: "drop-shadow-[0_0_6px_rgba(14,165,233,0.4)]" },
    greeting: "Gigawatt Electrician! The NEC is becoming second nature. Stay on it.",
    advancementMessage: "Gigawatt Electrician! Your consistency is paying off — the exam is getting nervous.",
  },
  {
    classification: "terawatt_electrician",
    title: "Terawatt Electrician",
    minWatts: 28_000,
    icon: "🗼",
    colors: { text: "text-blue-500 dark:text-blue-400", bg: "bg-blue-500/10", glow: "drop-shadow-[0_0_7px_rgba(59,130,246,0.4)]" },
    greeting: "Terawatt Electrician! A month of grid-grade dedication. Keep the load on.",
    advancementMessage: "Terawatt Electrician! A month of grid-grade study — elite territory now.",
  },
  {
    classification: "petawatt_electrician",
    title: "Petawatt Electrician",
    minWatts: 48_000,
    icon: "🌐",
    colors: { text: "text-purple dark:text-purple-light", bg: "bg-purple/10", glow: "drop-shadow-[0_0_8px_rgba(139,92,246,0.45)]" },
    greeting: "Petawatt Electrician! Few reach this charge level. The code bends to you.",
    advancementMessage: "Petawatt Electrician! Your NEC command is exceptional — keep the edge sharp.",
  },
  {
    classification: "exawatt_electrician",
    title: "Exawatt Electrician",
    minWatts: 75_000,
    icon: "☄️",
    colors: { text: "text-fuchsia-500 dark:text-fuchsia-400", bg: "bg-fuchsia-500/10", glow: "drop-shadow-[0_0_9px_rgba(217,70,239,0.5)]" },
    greeting: "Exawatt Electrician! You're operating at a scale most never see. Outstanding.",
    advancementMessage: "Exawatt Electrician! Two months of mastery — you're exam-ready and then some.",
  },
  {
    classification: "zettawatt_electrician",
    title: "Zettawatt Electrician",
    minWatts: 110_000,
    icon: "🌟",
    colors: { text: "text-orange-500 dark:text-orange-400", bg: "bg-orange-500/10", glow: "drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]" },
    greeting: "Zettawatt Electrician! This is championship-level study. Stay legendary.",
    advancementMessage: "Zettawatt Electrician! Truly rare charge — your mastery is electrifying.",
  },
  {
    classification: "yottawatt_electrician",
    title: "Yottawatt Electrician",
    minWatts: 160_000,
    icon: "🌩️",
    colors: { text: "text-amber-300 dark:text-amber-200", bg: "bg-amber-300/15", glow: "drop-shadow-[0_0_14px_rgba(252,211,77,0.65)]" },
    greeting: "Yottawatt Electrician — maximum charge. You ARE the code reference.",
    advancementMessage: "YOTTAWATT ELECTRICIAN! Maximum classification — you are the ultimate electrician!",
  },
];

/** Look up a rank's full config by its key (for colors/greeting/advancement copy). */
export function getClassificationByKey(key: UserClassification): ClassificationConfig {
  return CLASSIFICATIONS.find((c) => c.classification === key) ?? CLASSIFICATIONS[0];
}

export function getUserClassification(lifetimeWatts: number): ClassificationConfig {
  for (let i = CLASSIFICATIONS.length - 1; i >= 0; i--) {
    if (lifetimeWatts >= CLASSIFICATIONS[i].minWatts) {
      return CLASSIFICATIONS[i];
    }
  }
  return CLASSIFICATIONS[0];
}

export function getClassificationTitle(lifetimeWatts: number): string {
  return getUserClassification(lifetimeWatts).title;
}

/**
 * Get progress toward the next classification (based on lifetime Watts).
 */
export function getClassificationProgress(lifetimeWatts: number): {
  current: ClassificationConfig;
  next: ClassificationConfig | null;
  percentage: number;
} {
  const current = getUserClassification(lifetimeWatts);
  const currentIndex = CLASSIFICATIONS.indexOf(current);
  const next = currentIndex < CLASSIFICATIONS.length - 1 ? CLASSIFICATIONS[currentIndex + 1] : null;

  if (!next) {
    return { current, next: null, percentage: 100 };
  }

  const range = next.minWatts - current.minWatts;
  const progress = lifetimeWatts - current.minWatts;
  const percentage = Math.min(Math.round((progress / range) * 100), 99);

  return { current, next, percentage };
}

/**
 * Check if a classification advancement occurred (based on lifetime Watts).
 */
export function checkClassificationAdvancement(
  previousLifetime: number,
  newLifetime: number
): { newClassification: UserClassification; newTitle: string } | null {
  const prev = getUserClassification(previousLifetime);
  const curr = getUserClassification(newLifetime);
  if (curr.classification !== prev.classification) {
    return { newClassification: curr.classification, newTitle: curr.title };
  }
  return null;
}

// ─── Scaffolding (now difficulty-based, not tier-based) ─────────────────────

export function getScaffolding(difficulty: Difficulty | string): Scaffolding {
  switch (difficulty) {
    case "apprentice":
      return { showHints: true, showFormulas: true, showNecReferences: true, showArticleNumbers: true };
    case "journeyman":
      return { showHints: true, showFormulas: true, showNecReferences: true, showArticleNumbers: true };
    case "master":
      return { showHints: false, showFormulas: false, showNecReferences: false, showArticleNumbers: false };
    default:
      return { showHints: false, showFormulas: true, showNecReferences: true, showArticleNumbers: true };
  }
}
