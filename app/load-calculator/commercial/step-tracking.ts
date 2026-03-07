// ─── Step-to-equipment mapping for scratch-off ─────────────────────────────

export const COMMERCIAL_STEP_EQUIPMENT_MAP: Record<string, string[]> = {
  "lighting-load": ["square-footage"],
  "lighting-demand": [],
  "hvac": ["ac-motor", "heat"],
  "outlet-loads": ["lampholders", "receptacles", "multioutlet", "show-window", "sign-outlet"],
  "kitchen-demand": [], // kitchen items scratched off here dynamically
  "convert-motors": [], // motors highlighted but not scratched off (still needed for next step)
  "largest-motor-25": [],
  "total-va": [],
  "service-conductor": [],
};

// Steps that sum into total-va
export const COMMERCIAL_TOTAL_VA_STEPS = [
  "lighting-demand",
  "hvac",
  "outlet-loads",
  "kitchen-demand",
  "convert-motors",
  "largest-motor-25",
];
