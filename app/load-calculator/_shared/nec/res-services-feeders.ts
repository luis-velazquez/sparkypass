// Residential Services & Feeders — Single-Phase Dwelling (120/240V)
// NEC 2020: Table 310.12 → NEC 2023: Table 310.12(A) → NEC 2026: Table 310.12(A)
// Data is identical across editions — only the table number changed in 2023.
// Maps service rating amps directly to conductor size (83% already factored in).

import type { DwellingConductorEntry } from "./types";
import type { NecVersion } from "@/types/question";

const TABLE_REF: Record<NecVersion, string> = {
  "2023": "Table 310.12(A)",
  "2026": "Table 310.12(A)",
};

/** Returns the correct NEC table number for the user's selected code year. */
export function getResServicesFeedersTableRef(version: NecVersion): string {
  return TABLE_REF[version];
}

export const DWELLING_CONDUCTOR_TABLE: DwellingConductorEntry[] = [
  { serviceRatingAmps: 100, copper: "4",   aluminum: "2" },
  { serviceRatingAmps: 110, copper: "3",   aluminum: "1" },
  { serviceRatingAmps: 125, copper: "2",   aluminum: "1/0" },
  { serviceRatingAmps: 150, copper: "1",   aluminum: "2/0" },
  { serviceRatingAmps: 175, copper: "1/0", aluminum: "3/0" },
  { serviceRatingAmps: 200, copper: "2/0", aluminum: "4/0" },
  { serviceRatingAmps: 225, copper: "3/0", aluminum: "250" },
  { serviceRatingAmps: 250, copper: "4/0", aluminum: "300" },
  { serviceRatingAmps: 300, copper: "250", aluminum: "350" },
  { serviceRatingAmps: 350, copper: "350", aluminum: "500" },
  { serviceRatingAmps: 400, copper: "400", aluminum: "600" },
];

// Look up copper conductor size for a dwelling unit service rating
export function getDwellingConductorSize(serviceAmps: number): string {
  const entry = DWELLING_CONDUCTOR_TABLE.find(e => e.serviceRatingAmps >= serviceAmps);
  return entry ? entry.copper : DWELLING_CONDUCTOR_TABLE[DWELLING_CONDUCTOR_TABLE.length - 1].copper;
}

// Look up aluminum conductor size for a dwelling unit service rating
export function getDwellingAluminumSize(serviceAmps: number): string {
  const entry = DWELLING_CONDUCTOR_TABLE.find(e => e.serviceRatingAmps >= serviceAmps);
  return entry ? entry.aluminum : DWELLING_CONDUCTOR_TABLE[DWELLING_CONDUCTOR_TABLE.length - 1].aluminum;
}
