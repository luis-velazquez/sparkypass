// Shared game helpers — extracted from individual game data files.

/** Fisher-Yates shuffle — returns a new array. Generic for any card/term type. */
export function shuffleArray<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Pick `count` unique random items from a pool (excluding one value).
 * Uses partial Fisher-Yates for efficiency.
 */
export function pickRandom(pool: string[], count: number): string[] {
  const arr = [...pool];
  const result: string[] = [];
  for (let i = 0; i < count && arr.length > 0; i++) {
    const j = Math.floor(Math.random() * arr.length);
    result.push(arr[j]);
    arr[j] = arr[arr.length - 1];
    arr.pop();
  }
  // Shuffle result before returning
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Returns energize level 0–4 based on streak. Default thresholds: 5/10/15/20. */
export function getEnergizeLevel(
  streak: number,
  thresholds: [number, number, number, number] = [5, 10, 15, 20],
): number {
  if (streak >= thresholds[3]) return 4;
  if (streak >= thresholds[2]) return 3;
  if (streak >= thresholds[1]) return 2;
  if (streak >= thresholds[0]) return 1;
  return 0;
}

/** Get all pack IDs in order from a pack array. */
export function getPackIds<P extends { id: string }>(packs: readonly P[]): string[] {
  return packs.map((p) => p.id);
}

/** Filter items from unlocked packs, flattening the result. */
export function getUnlockedItems<P extends { id: string }, T>(
  packs: readonly P[],
  unlockedPacks: string[],
  getItems: (pack: P) => T[],
): T[] {
  const set = new Set(unlockedPacks);
  return packs.filter((p) => set.has(p.id)).flatMap(getItems);
}
