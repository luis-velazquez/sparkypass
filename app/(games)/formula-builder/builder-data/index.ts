import {
  shuffleArray,
  getEnergizeLevel as _getEnergizeLevel,
  getPackIds as _getPackIds,
  getUnlockedItems,
} from "../../game-helpers";

import { FORMULA_PACKS } from "./packs";

// ─── Re-exports ──────────────────────────────────────────────────────────────

export type { FormulaStep, FormulaScenario, FormulaPack } from "./types";
export { FORMULA_PACKS } from "./packs";

// ─── Derived flat array for game logic ───────────────────────────────────────

export const SCENARIOS = FORMULA_PACKS.flatMap((p) => p.scenarios);

// ─── Reactions & messages ────────────────────────────────────────────────────

export const CORRECT_REACTIONS: string[] = [
  "Built!",
  "Wired!",
  "Connected!",
  "Assembled!",
  "Sequenced!",
  "Engineered!",
  "Calculated!",
  "Constructed!",
];

export const TRIP_MESSAGES: string[] = [
  "That step is out of sequence \u2014 check the NEC procedure order!",
  "Close, but the Code requires a different step here.",
  "Not quite \u2014 think about what information you need before this step.",
  "Wrong order! Each step depends on the result of the one before it.",
  "Circuit tripped! Review the article references and try again.",
];

// ─── Wrappers using shared helpers ───────────────────────────────────────────

/** Fisher-Yates shuffle for formula steps. */
export const shuffleSteps = shuffleArray;

/** Map a correct-answer streak to an energize level (0-4). Thresholds: 3/6/12/20. */
export function getEnergizeLevel(streak: number): number {
  return _getEnergizeLevel(streak, [3, 6, 12, 20]);
}

/** Get all unique pack IDs in order. */
export function getPackIds(): string[] {
  return _getPackIds(FORMULA_PACKS);
}

/** Get scenarios from unlocked packs only. */
export function getUnlockedScenarios(unlockedPacks: string[]) {
  return getUnlockedItems(FORMULA_PACKS, unlockedPacks, (p) => p.scenarios);
}
