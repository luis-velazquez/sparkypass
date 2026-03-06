// Conductor Ampacity — NEC Table 310.16 (75°C)
// Same table number across 2020, 2023, and 2026 editions.

import type { ConductorEntry } from "./types";

export const CONDUCTOR_TABLE: ConductorEntry[] = [
  { size: "14",    ampacity: 20,  aluminumAmpacity: 0 },
  { size: "12",    ampacity: 25,  aluminumAmpacity: 20 },
  { size: "10",    ampacity: 35,  aluminumAmpacity: 30 },
  { size: "8",     ampacity: 50,  aluminumAmpacity: 40 },
  { size: "6",     ampacity: 65,  aluminumAmpacity: 50 },
  { size: "4",     ampacity: 85,  aluminumAmpacity: 65 },
  { size: "3",     ampacity: 100, aluminumAmpacity: 75 },
  { size: "2",     ampacity: 115, aluminumAmpacity: 90 },
  { size: "1",     ampacity: 130, aluminumAmpacity: 100 },
  { size: "1/0",   ampacity: 150, aluminumAmpacity: 120 },
  { size: "2/0",   ampacity: 175, aluminumAmpacity: 135 },
  { size: "3/0",   ampacity: 200, aluminumAmpacity: 155 },
  { size: "4/0",   ampacity: 230, aluminumAmpacity: 180 },
  { size: "250",   ampacity: 255, aluminumAmpacity: 205 },
  { size: "300",   ampacity: 285, aluminumAmpacity: 230 },
  { size: "350",   ampacity: 310, aluminumAmpacity: 250 },
  { size: "400",   ampacity: 335, aluminumAmpacity: 270 },
  { size: "500",   ampacity: 380, aluminumAmpacity: 310 },
  { size: "600",   ampacity: 420, aluminumAmpacity: 340 },
  { size: "700",   ampacity: 460, aluminumAmpacity: 375 },
  { size: "750",   ampacity: 475, aluminumAmpacity: 385 },
];

// Get minimum copper conductor size for a given ampacity
export function getConductorSize(amps: number): ConductorEntry {
  for (const entry of CONDUCTOR_TABLE) {
    if (entry.ampacity >= amps) return entry;
  }
  return CONDUCTOR_TABLE[CONDUCTOR_TABLE.length - 1];
}

// Get minimum aluminum conductor size for a given ampacity
export function getAluminumConductorSize(amps: number): ConductorEntry | null {
  for (const entry of CONDUCTOR_TABLE) {
    if (entry.aluminumAmpacity > 0 && entry.aluminumAmpacity >= amps) return entry;
  }
  return null;
}
