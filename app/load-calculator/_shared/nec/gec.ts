// Grounding Electrode Conductor (GEC) Sizing — NEC Table 250.66
// Same table number across 2020, 2023, and 2026 editions.
// Maps service conductor size to GEC size.

import type { GECEntry } from "./types";

// Numeric sort value for conductor sizes (smaller number = smaller conductor)
export function conductorSortValue(size: string): number {
  const awgMap: Record<string, number> = {
    "14": -14, "12": -12, "10": -10, "8": -8, "6": -6,
    "4": -4, "3": -3, "2": -2, "1": -1,
    "1/0": 0, "2/0": 1, "3/0": 2, "4/0": 3,
  };
  if (awgMap[size] !== undefined) return awgMap[size];
  return parseFloat(size); // kcmil values
}

export const GEC_TABLE: GECEntry[] = [
  { maxConductorSize: "2",   maxConductorArea: -2,  gecSize: "8" },
  { maxConductorSize: "1",   maxConductorArea: -1,  gecSize: "6" },
  { maxConductorSize: "1/0", maxConductorArea: 0,   gecSize: "6" },
  { maxConductorSize: "2/0", maxConductorArea: 1,   gecSize: "4" },
  { maxConductorSize: "3/0", maxConductorArea: 2,   gecSize: "4" },
  { maxConductorSize: "4/0", maxConductorArea: 3,   gecSize: "2" },
  { maxConductorSize: "250", maxConductorArea: 250,  gecSize: "2" },
  { maxConductorSize: "300", maxConductorArea: 300,  gecSize: "2" },
  { maxConductorSize: "350", maxConductorArea: 350,  gecSize: "2" },
  { maxConductorSize: "500", maxConductorArea: 500,  gecSize: "1/0" },
  { maxConductorSize: "600", maxConductorArea: 600,  gecSize: "1/0" },
  { maxConductorSize: "750", maxConductorArea: 750,  gecSize: "2/0" },
  { maxConductorSize: "1000", maxConductorArea: 1000, gecSize: "3/0" },
];

// Get GEC size based on service conductor size
export function getGECSize(conductorSize: string): string {
  const sortVal = conductorSortValue(conductorSize);
  for (const entry of GEC_TABLE) {
    if (sortVal <= entry.maxConductorArea) return entry.gecSize;
  }
  return "3/0"; // Largest GEC
}
