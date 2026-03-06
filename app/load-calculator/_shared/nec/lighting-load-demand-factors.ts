// Lighting Load Demand Factors (Non-Dwelling)
// NEC 2020: Table 220.42 → NEC 2023: Table 220.45 → NEC 2026: Table 120.45
// Data is identical across editions — only the table number changed.
// Different building types have different demand factor tiers.

import type { DemandTier } from "./types";
import type { NecVersion } from "@/types/question";

const TABLE_REF: Record<NecVersion, string> = {
  "2023": "Table 220.45",
  "2026": "Table 120.45",
};

/** Returns the correct NEC table number for the user's selected code year. */
export function getLightingDemandTableRef(version: NecVersion): string {
  return TABLE_REF[version];
}

export const LIGHTING_DEMAND_TABLE: Record<string, { tiers: DemandTier[]; label: string }> = {
  hotel: {
    label: "Hotels/Motels",
    tiers: [
      { upToVA: 20000, factor: 0.5 },
      { upToVA: Infinity, factor: 0.4 },
    ],
  },
  hospital: {
    label: "Hospitals",
    tiers: [
      { upToVA: 50000, factor: 0.4 },
      { upToVA: Infinity, factor: 0.2 },
    ],
  },
  warehouse: {
    label: "Storage/Warehouse",
    tiers: [
      { upToVA: 12500, factor: 1.0 },
      { upToVA: Infinity, factor: 0.5 },
    ],
  },
  // All other building types: 100% (no reduction)
  default: {
    label: "All Others (Office, Restaurant, Retail, School, etc.)",
    tiers: [
      { upToVA: Infinity, factor: 1.0 },
    ],
  },
};

// Apply lighting demand factors
export function applyLightingDemand(totalLightingVA: number, buildingType: string): number {
  const entry = LIGHTING_DEMAND_TABLE[buildingType] || LIGHTING_DEMAND_TABLE["default"];
  let remaining = totalLightingVA;
  let demandVA = 0;
  let previousCap = 0;

  for (const tier of entry.tiers) {
    const tierCapacity = tier.upToVA === Infinity ? remaining : tier.upToVA - previousCap;
    const vaInTier = Math.min(remaining, tierCapacity);
    demandVA += Math.round(vaInTier * tier.factor);
    remaining -= vaInTier;
    previousCap = tier.upToVA;
    if (remaining <= 0) break;
  }

  return demandVA;
}
