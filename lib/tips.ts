import tipsData from "@/data/tips.json";
import type { Tip } from "@/types/tip";

const tips = tipsData.tips as Tip[];

export const TIP_ENABLED_KEY = "sparkypass-tip-enabled";
export const SEEN_TIPS_KEY = "sparkypass-seen-tips";

export function getSeenTipIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(SEEN_TIPS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function markTipSeen(id: string): void {
  const seen = getSeenTipIds();
  if (!seen.includes(id)) {
    seen.push(id);
    localStorage.setItem(SEEN_TIPS_KEY, JSON.stringify(seen));
  }
}

export function getRandomUnseenTip(seenIds: string[]): Tip | null {
  const unseen = tips.filter((t) => !seenIds.includes(t.id));
  if (unseen.length === 0) return null;
  return unseen[Math.floor(Math.random() * unseen.length)];
}

export function getRandomSeenTip(seenIds: string[]): Tip | null {
  const seen = tips.filter((t) => seenIds.includes(t.id));
  if (seen.length === 0) return null;
  return seen[Math.floor(Math.random() * seen.length)];
}
