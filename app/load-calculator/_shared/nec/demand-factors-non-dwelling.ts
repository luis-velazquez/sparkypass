// Receptacle Load Demand Factors (Non-Dwelling)
// NEC 2020: Table 220.44 → NEC 2023: Table 220.47 → NEC 2026: Table 120.47
// Data is identical across editions — only the table number changed.
// First 10 kVA at 100%, remainder at 50%.

import type { NecVersion } from "@/types/question";

const TABLE_REF: Record<NecVersion, string> = {
  "2023": "Table 220.47",
  "2026": "Table 120.47",
};

/** Returns the correct NEC table number for the user's selected code year. */
export function getReceptacleDemandTableRef(version: NecVersion): string {
  return TABLE_REF[version];
}

export function applyReceptacleDemand(totalOutletVA: number): number {
  if (totalOutletVA <= 10000) return totalOutletVA;
  return 10000 + Math.round((totalOutletVA - 10000) * 0.5);
}
