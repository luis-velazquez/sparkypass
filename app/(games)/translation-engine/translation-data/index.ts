export type { TranslationCard, TranslationPack } from "./types";
export { TRANSLATION_PACKS } from "./packs";

import { TRANSLATION_PACKS } from "./packs";
import type { TranslationCard } from "./types";
import {
  shuffleArray,
  pickRandom,
  getEnergizeLevel,
  getPackIds as _getPackIds,
  getUnlockedItems,
} from "../../game-helpers";

/** Derived flat array of all cards across all packs */
export const TRANSLATION_CARDS: TranslationCard[] = TRANSLATION_PACKS.flatMap(
  (p) => p.cards,
);

export const CORRECT_REACTIONS = [
  "Translated!",
  "Decoded!",
  "Fluent!",
  "Code-speak mastered!",
  "Perfect translation!",
  "NEC native speaker!",
  "Slang cracked!",
  "Sparky speaks fluent Code!",
];

export const TRIP_MESSAGES = [
  "Lost in translation — try again!",
  "That slang doesn't map there. Check again!",
  "Mistranslation! Here's the official term.",
  "Not quite — the Code says it differently.",
  "Wrong translation — Sparky's got the answer.",
];

/**
 * Returns `count` unique random official terms from the pool,
 * excluding `correctOfficialTerm`. Results are shuffled.
 */
export function getDistractors(
  correctOfficialTerm: string,
  allCards: TranslationCard[],
  count: number,
): string[] {
  const pool = allCards
    .map((c) => c.officialTerm)
    .filter((term) => term !== correctOfficialTerm);
  return pickRandom(pool, count);
}

/** Fisher-Yates shuffle — returns a new array */
export function shuffleCards(cards: TranslationCard[]): TranslationCard[] {
  return shuffleArray(cards);
}

/** Re-export energize level helper */
export { getEnergizeLevel };

/** Get all unique pack IDs in order */
export function getPackIds(): string[] {
  return _getPackIds(TRANSLATION_PACKS);
}

/** Filter cards by unlocked packs */
export function getUnlockedCards(unlockedPacks: string[]): TranslationCard[] {
  return getUnlockedItems(TRANSLATION_PACKS, unlockedPacks, (p) => p.cards);
}
