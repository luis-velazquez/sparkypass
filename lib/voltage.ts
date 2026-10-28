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

// ─── User Classification (replaces 7 voltage tiers) ────────────────────────

export interface ClassificationConfig {
  classification: UserClassification;
  title: string;
  minWatts: number;
  icon: string;
}

// Ten SI-prefix ranks on a reachable curve. Keyed off LIFETIME Watts
// (monotonic — earning only ever moves you up; spending Watts on power-ups
// must never demote you, which the old wattsBalance keying did). The old
// 1K → 1M → 1B curve parked everyone at "Kilowatt" for months; these steps
// track a realistic exam-prep season (~160K lifetime Watts to the summit).
export const CLASSIFICATIONS: ClassificationConfig[] = [
  { classification: "milliwatt_electrician", title: "Milliwatt Electrician", minWatts: 0, icon: "🔋" },
  { classification: "watt_electrician", title: "Watt Electrician", minWatts: 1_000, icon: "💡" },
  { classification: "kilowatt_electrician", title: "Kilowatt Electrician", minWatts: 3_000, icon: "🔌" },
  { classification: "megawatt_electrician", title: "Megawatt Electrician", minWatts: 7_500, icon: "⚙️" },
  { classification: "gigawatt_electrician", title: "Gigawatt Electrician", minWatts: 15_000, icon: "🏭" },
  { classification: "terawatt_electrician", title: "Terawatt Electrician", minWatts: 28_000, icon: "🗼" },
  { classification: "petawatt_electrician", title: "Petawatt Electrician", minWatts: 48_000, icon: "🌩️" },
  { classification: "exawatt_electrician", title: "Exawatt Electrician", minWatts: 75_000, icon: "⛈️" },
  { classification: "zettawatt_electrician", title: "Zettawatt Electrician", minWatts: 110_000, icon: "☀️" },
  { classification: "yottawatt_electrician", title: "Yottawatt Electrician", minWatts: 160_000, icon: "🌟" },
];

export function getUserClassification(wattsLifetime: number): ClassificationConfig {
  for (let i = CLASSIFICATIONS.length - 1; i >= 0; i--) {
    if (wattsLifetime >= CLASSIFICATIONS[i].minWatts) {
      return CLASSIFICATIONS[i];
    }
  }
  return CLASSIFICATIONS[0];
}

export function getClassificationTitle(wattsLifetime: number): string {
  return getUserClassification(wattsLifetime).title;
}

/**
 * Get progress toward the next classification (from lifetime Watts).
 */
export function getClassificationProgress(wattsLifetime: number): {
  current: ClassificationConfig;
  next: ClassificationConfig | null;
  percentage: number;
} {
  const current = getUserClassification(wattsLifetime);
  const currentIndex = CLASSIFICATIONS.indexOf(current);
  const next = currentIndex < CLASSIFICATIONS.length - 1 ? CLASSIFICATIONS[currentIndex + 1] : null;

  if (!next) {
    return { current, next: null, percentage: 100 };
  }

  const range = next.minWatts - current.minWatts;
  const progress = wattsLifetime - current.minWatts;
  const percentage = Math.min(Math.round((progress / range) * 100), 99);

  return { current, next, percentage };
}

/**
 * Check if a classification advancement occurred (lifetime Watts pre/post).
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
