import type { CalculationStep } from "./types";
import { CALCULATION_STEPS } from "./steps";

// Mapping of step IDs to the appliance IDs that are accounted for when that step is completed
export const STEP_APPLIANCE_MAP: Record<string, string[]> = {
  "general-lighting": ["square-footage"],
  "small-appliance-laundry": ["small-appliance-1", "small-appliance-2", "laundry"],
  "lighting-demand": [],
  "hvac": ["ac", "heat"],  // Motors scratched off when used in HVAC comparison
  "fixed-appliances": ["water-heater", "dishwasher", "disposal", "microwave", "wine-cooler", "pool-pump"],
  "dryer": ["dryer"],
  "range": ["range", "cooktop"],
  "largest-motor-25": [],
  "total-va": [],
  "service-amps": [],
  "service-conductor": [],
  "gec-size": [],
};

// Get all appliance IDs that have been accounted for up to and including a given step index
export function getAccountedApplianceIds(stepIndex: number, steps: CalculationStep[] = CALCULATION_STEPS): Set<string> {
  const accountedIds = new Set<string>();

  for (let i = 0; i <= stepIndex; i++) {
    const stepId = steps[i]?.id;
    if (stepId && STEP_APPLIANCE_MAP[stepId]) {
      STEP_APPLIANCE_MAP[stepId].forEach(id => accountedIds.add(id));
    }
  }

  return accountedIds;
}

// Step IDs that need to be summed for the total-va calculation
export const TOTAL_VA_COMPONENT_STEPS = [
  "lighting-demand",
  "hvac",
  "fixed-appliances",
  "dryer",
  "range",
  "largest-motor-25",
];
