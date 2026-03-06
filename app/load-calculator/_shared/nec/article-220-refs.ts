// Article 220 section references — renumbered to Article 120 in NEC 2026.
// Each getter returns the correct section number for the user's selected code year.

import type { NecVersion } from "@/types/question";

const OUTLET_LOADS_REF: Record<NecVersion, string> = {
  "2023": "220.14",
  "2026": "120.14",
};

const TOTAL_LOAD_REF: Record<NecVersion, string> = {
  "2023": "220.40",
  "2026": "120.40",
};

const MOTOR_LOAD_REF: Record<NecVersion, string> = {
  "2023": "220.50",
  "2026": "120.50",
};

const HVAC_REF: Record<NecVersion, string> = {
  "2023": "220.60",
  "2026": "120.60",
};

/** 220.14 / 120.14 — Outlet loads */
export function getOutletLoadsRef(version: NecVersion): string {
  return OUTLET_LOADS_REF[version];
}

/** 220.40 / 120.40 — Total calculated load */
export function getTotalLoadRef(version: NecVersion): string {
  return TOTAL_LOAD_REF[version];
}

/** 220.50 / 120.50 — Largest motor 25% addition */
export function getMotorLoadRef(version: NecVersion): string {
  return MOTOR_LOAD_REF[version];
}

/** 220.60 / 120.60 — HVAC non-coincident loads */
export function getHvacRef(version: NecVersion): string {
  return HVAC_REF[version];
}
