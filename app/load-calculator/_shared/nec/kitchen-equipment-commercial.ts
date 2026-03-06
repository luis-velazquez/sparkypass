// Kitchen Equipment Demand Factors (Commercial)
// NEC 2020: Table 220.56 → NEC 2023: Table 220.56 → NEC 2026: Table 120.56
// Data is identical across editions — only the table number changed in 2026.

import type { NecVersion } from "@/types/question";

const TABLE_REF: Record<NecVersion, string> = {
  "2023": "Table 220.56",
  "2026": "Table 120.56",
};

/** Returns the correct NEC table number for the user's selected code year. */
export function getKitchenEquipmentTableRef(version: NecVersion): string {
  return TABLE_REF[version];
}

export const KITCHEN_DEMAND_FACTORS: Record<number, number> = {
  1: 1.0,
  2: 1.0,
  3: 0.9,
  4: 0.8,
  5: 0.7,
  6: 0.65,
};

export function getKitchenDemandFactor(count: number): number {
  if (count <= 2) return 1.0;
  if (count === 3) return 0.9;
  if (count === 4) return 0.8;
  if (count === 5) return 0.7;
  return 0.65; // 6 or more
}
