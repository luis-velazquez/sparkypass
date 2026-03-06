// Fractions of an Ampere — round up at 0.5 or greater
// NEC 2020: 220.5(B) → NEC 2023: 220.5(B) → NEC 2026: 120.5(B)
// Rule is identical across editions — only the section number changed in 2026.

import type { NecVersion } from "@/types/question";

const RULE_REF: Record<NecVersion, string> = {
  "2023": "220.5(B)",
  "2026": "120.5(B)",
};

/** Returns the correct NEC section number for the user's selected code year. */
export function getFractionsOfAnAmpereRef(version: NecVersion): string {
  return RULE_REF[version];
}

/** Fractional amps >= 0.5 round up to the next whole number. */
export function roundFractionalAmps(amps: number): number {
  return Math.round(amps);
}
