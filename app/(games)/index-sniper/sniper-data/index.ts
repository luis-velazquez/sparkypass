export type { SniperDeck, SniperCard, SniperPack } from "./types";
export { SNIPER_PACKS, SNIPER_MERGED_PACKS } from "./packs";

import { SNIPER_PACKS } from "./packs";
import type { SniperCard } from "./types";
import {
  shuffleArray,
  getEnergizeLevel as _getEnergizeLevel,
  getPackIds as _getPackIds,
  getUnlockedItems,
} from "../../game-helpers";

/** All cards flattened from every pack. */
export const SNIPER_CARDS: SniperCard[] = SNIPER_PACKS.flatMap((p) => p.cards);

// ─── Constants ────────────────────────────────────────────────────────────────

export const CORRECT_REACTIONS = [
  "Dead center!",
  "Bullseye — perfect shot!",
  "Target neutralized!",
  "Scope locked, nailed it!",
  "Clean hit — no ricochet!",
  "Right between the eyes!",
  "One shot, one code section!",
  "Sparky confirms the kill!",
];

export const TRIP_MESSAGES = [
  "Missed! Re-zero your scope.",
  "Off target — check your reference!",
  "That shot went wide. Try again!",
  "Misfire! Here's the correct section.",
  "No hit — Sparky's got the coordinates.",
];

// ─── Sniper-specific helper ───────────────────────────────────────────────────

/**
 * Extract the article family from a reference string.
 * e.g. "314.16(A)" → "314", "Table 310.16" → "310", "250.52(A)(3)" → "250"
 */
function getArticleFamily(ref: string): string {
  const match = ref.match(/(\d{3})/);
  return match ? match[1] : ref;
}

/**
 * Returns `count` unique random reference strings from the pool,
 * excluding `correctRef`. Results are shuffled.
 */
export function getDistractors(
  correctRef: string,
  allCards: SniperCard[],
  count: number,
  smartFilter: boolean = false,
): string[] {
  const correctFamily = getArticleFamily(correctRef);
  const isTableQuestion = correctRef.startsWith("Table ");

  let pool = allCards
    .map((c) => c.reference)
    .filter((ref) => ref !== correctRef);

  // Keep table and non-table references separate
  if (isTableQuestion) {
    const tableOnly = pool.filter((ref) => ref.startsWith("Table "));
    if (tableOnly.length >= count) pool = tableOnly;
  } else {
    const nonTable = pool.filter((ref) => !ref.startsWith("Table "));
    if (nonTable.length >= count) pool = nonTable;
  }

  // Smart filter: exclude same article family (e.g. no 314.xx distractors when answer is 314.16)
  if (smartFilter) {
    const filtered = pool.filter((ref) => getArticleFamily(ref) !== correctFamily);
    // Only use filtered pool if we have enough distractors
    if (filtered.length >= count) {
      pool = filtered;
    }
  }

  // Deduplicate references
  pool = [...new Set(pool)];

  // Fisher-Yates partial shuffle to pick `count` items
  const arr = [...pool];
  const result: string[] = [];
  for (let i = 0; i < count && arr.length > 0; i++) {
    const j = Math.floor(Math.random() * arr.length);
    result.push(arr[j]);
    arr[j] = arr[arr.length - 1];
    arr.pop();
  }

  // Shuffle the result before returning
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

// ─── Thin wrappers delegating to shared helpers ───────────────────────────────

/** Fisher-Yates shuffle — returns a new array */
export function shuffleCards(cards: SniperCard[]): SniperCard[] {
  return shuffleArray(cards);
}

/** Returns energize level 0-4 based on streak */
export function getEnergizeLevel(streak: number): number {
  return _getEnergizeLevel(streak);
}

/** Get all unique pack IDs in order */
export function getPackIds(): string[] {
  return _getPackIds(SNIPER_PACKS);
}

/** Get cards from unlocked packs only */
export function getUnlockedCards(unlockedPacks: string[]): SniperCard[] {
  return getUnlockedItems(SNIPER_PACKS, unlockedPacks, (p) => p.cards);
}
